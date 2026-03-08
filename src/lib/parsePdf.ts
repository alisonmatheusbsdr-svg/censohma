import * as pdfjsLib from 'pdfjs-dist';
import type { AmbulatorioPatient, AmbulatorioResult } from './types';

// Configure the worker to use the unpkg CDN to avoid Vite build conflicts with pdf.worker.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export async function parsePdfToPatients(file: File): Promise<AmbulatorioResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    const patients: AmbulatorioPatient[] = [];
    let servico = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Group text items by roughly their Y coordinate (line by line)
      // Because PDF text items can have slight fractional differences in Y,
      // we round it to a reasonable pixel tolerance (e.g., nearest 3px or 5px block)
      const linesMap = new Map<number, { str: string; x: number }[]>();
      
      textContent.items.forEach((item: any) => {
        // item.transform is [scaleX, skewY, skewX, scaleY, transX, transY]
        // transform[5] is the Y coordinate (from bottom up usually)
        const yCoord = Math.round(item.transform[5] / 3) * 3; 
        const xCoord = item.transform[4];
        
        if (!linesMap.has(yCoord)) {
          linesMap.set(yCoord, []);
        }
        linesMap.get(yCoord)!.push({ str: item.str, x: xCoord });
      });

      // Sort Y coordinates descending (PDF coords usually start from bottom)
      const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);
      
      let fullPageText = '';
      
      // Reconstruct the page line by line, sorting pieces on X axis left-to-right
      sortedY.forEach(y => {
        const lineItems = linesMap.get(y)!;
        lineItems.sort((a, b) => a.x - b.x); // sort left to right
        const lineText = lineItems.map(item => item.str).join(' ');
        fullPageText += lineText + '\n';
      });

      // Now we have a reliable line-by-line flow for the whole page.
      // 1. Matches Prontuário and Name
      const idNameRegex = /\b(\d{4,10})\s+-\s+([A-ZÀ-Ÿ.\s]+?)(?=\s+(?:CONSULTA|PRIMEIRA|EXAME|USG|RETORNO|Telefone|Celular))/ig;
      // 2. Matches Date of Birth and Age
      const dtNascRegex = /Dt\s*Nasc.*?(\d{2}\/\d{2}\/\d{4}).*?Idade.*?(\d+)\s*a/ig;
      
      // Since it's properly sorted page by page, we can safely zip matches again per page.
      const namesMatches = [...fullPageText.matchAll(idNameRegex)];
      const datesMatches = [...fullPageText.matchAll(dtNascRegex)];

      // Extract Serviço (e.g., "CLINICA MEDICA") - appears after service-related keywords
      if (!servico) {
        const servicoRegex = /(?:CONSULTA\s+(?:CLINICA\s+MEDICA|[A-ZÀ-Ÿ\s]+?))\s+((?:CLINICA\s+MEDICA|[A-ZÀ-Ÿ]+(?:\s+[A-ZÀ-Ÿ]+)*))\s+(?:PRIMEIRA|CONSULTA\s+DE)/i;
        const servicoMatch = fullPageText.match(servicoRegex);
        if (servicoMatch) {
          servico = servicoMatch[1].trim();
        } else {
          // Fallback: look for the Serviço column value pattern
          const fallbackRegex = /Servi[çc]o\s+/i;
          const idx = fullPageText.search(fallbackRegex);
          if (idx >= 0) {
            // Try to find a capitalized service name after the header
            const afterHeader = fullPageText.slice(idx);
            const valMatch = afterHeader.match(/(?:CLINICA\s+MEDICA|CARDIOLOGIA|DERMATOLOGIA|ENDOCRINOLOGIA|GASTROENTEROLOGIA|NEUROLOGIA|ORTOPEDIA|PEDIATRIA|PNEUMOLOGIA|REUMATOLOGIA|UROLOGIA|[A-ZÀ-Ÿ]+(?:\s+[A-ZÀ-Ÿ]+)*)/i);
            if (valMatch) {
              servico = valMatch[0].trim();
            }
          }
        }
      }

      for (let j = 0; j < namesMatches.length; j++) {
        const match = namesMatches[j];
        const prontuario = match[1];
        const name = match[2].trim().replace(/\s+/g, ' ');
        
        let dataNascimento = 'N/I';
        let idade = 0;

        if (datesMatches[j]) {
          dataNascimento = datesMatches[j][1];
          idade = parseInt(datesMatches[j][2], 10);
        }
        
        patients.push({ prontuario, name, dataNascimento, idade });
      }
    }
    
    return { patients, servico };
  } catch (error) {
    console.error("Error parsing PDF:", error);
    throw new Error("Não foi possível ler o arquivo PDF. Verifique se é um arquivo do SOULMV válido.");
  }
}
