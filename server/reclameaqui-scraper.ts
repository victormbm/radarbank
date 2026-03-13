/**
 * Scraper REAL do Reclame Aqui
 * 
 * Coleta dados reais e atualizados do site reclameaqui.com.br
 * Executar 3x ao dia: 8h, 14h, 20h
 */

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser } from 'puppeteer';

// Adicionar plugin stealth para evitar detecção
puppeteer.use(StealthPlugin());

export interface ReclameAquiRealData {
  bankName: string;
  reputationScore: number; // 0-10
  resolvedRate: number; // 0-100%
  averageRating: number; // 0-5 estrelas (conversão de 0-10)
  totalComplaints: number;
  responseTime: number; // horas (estimado)
  topComplaints: string[];
  sentimentScore: number; // calculado
  lastUpdate: Date;
  rawHtml?: string; // debug
}

// Mapeamento de slugs dos bancos no Reclame Aqui
const RECLAMEAQUI_URLS: Record<string, string> = {
  'nubank': 'https://www.reclameaqui.com.br/empresa/nu-pagamentos-sa-nubank/',
  'itau': 'https://www.reclameaqui.com.br/empresa/itau-unibanco/',
  'bradesco': 'https://www.reclameaqui.com.br/empresa/bradesco/',
  'santander': 'https://www.reclameaqui.com.br/empresa/santander/',
  'bb': 'https://www.reclameaqui.com.br/empresa/banco-do-brasil/',
  'banco-do-brasil': 'https://www.reclameaqui.com.br/empresa/banco-do-brasil/',
  'caixa': 'https://www.reclameaqui.com.br/empresa/caixa-economica-federal/',
  'inter': 'https://www.reclameaqui.com.br/empresa/banco-inter/',
  'c6': 'https://www.reclameaqui.com.br/empresa/c6-bank/',
  'pagbank': 'https://www.reclameaqui.com.br/empresa/pagbank/',
  'btg': 'https://www.reclameaqui.com.br/empresa/btg-pactual/',
  'safra': 'https://www.reclameaqui.com.br/empresa/banco-safra/',
  'original': 'https://www.reclameaqui.com.br/empresa/banco-original/',
  'next': 'https://www.reclameaqui.com.br/empresa/banco-next/',
  'neon': 'https://www.reclameaqui.com.br/empresa/neon-pagamentos/',
};

export class ReclameAquiScraper {
  private browser: Browser | null = null;

  /**
   * Inicializar navegador
   */
  async initialize(): Promise<void> {
    console.log('🌐 Inicializando navegador Puppeteer...');
    
    this.browser = await puppeteer.launch({
      headless: true, // "new" para novo headless do Chrome
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });

    console.log('✅ Navegador iniciado');
  }

  /**
   * Fechar navegador
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      console.log('🔒 Navegador fechado');
    }
  }

  /**
   * Scrape dados de um banco específico
   */
  async scrapeBankData(bankSlug: string): Promise<ReclameAquiRealData | null> {
    const url = RECLAMEAQUI_URLS[bankSlug.toLowerCase()];
    
    if (!url) {
      console.warn(`⚠️  URL não encontrada para: ${bankSlug}`);
      return null;
    }

    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    
    try {
      console.log(`📊 Coletando dados de: ${bankSlug}`);
      console.log(`🔗 URL: ${url}`);

      // Configurar timeout e user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );
      
      // Navegar para a página
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Aguardar elementos carregarem
      await new Promise(resolve => setTimeout(resolve, 3000));

      // EXTRAIR DADOS
      const data = await page.evaluate(String.raw`
        (() => {
          const bodyText = (document.body.innerText || '').replace(/\s+/g, ' ').trim();
          const normalizedText = bodyText
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
          const compactText = normalizedText.replace(/\s+/g, '');

          const parseDecimalPtBr = (raw) => {
            if (!raw) return null;
            const cleaned = raw.replace(/\./g, '').replace(',', '.');
            const value = parseFloat(cleaned);
            return Number.isFinite(value) ? value : null;
          };

          const parseIntegerPtBr = (raw) => {
            if (!raw) return null;
            const onlyDigits = raw.replace(/\D/g, '');
            if (!onlyDigits) return null;
            const value = parseInt(onlyDigits, 10);
            return Number.isFinite(value) ? value : null;
          };

          let reputationScore = null;
          const notaMediaMatch = compactText.match(/notamedia(?:geral)?(?:e|nosultimos6mesese)([0-9]{1,2}[.,][0-9])\/10/i);
          if (notaMediaMatch) {
            reputationScore = parseDecimalPtBr(notaMediaMatch[1]);
          }

          if (reputationScore === null) {
            const raBadgeMatch = normalizedText.match(/RA\s*([0-9]{3,4})/i);
            if (raBadgeMatch) {
              const raValue = parseInt(raBadgeMatch[1], 10);
              if (Number.isFinite(raValue) && raValue > 0) {
                reputationScore = raValue / 100;
              }
            }
          }

          let resolvedRate = null;
          const respondedMatch = compactText.match(/respondeu([0-9]{1,3}(?:[.,][0-9])?)%dasreclamacoesrecebidas/i);
          if (respondedMatch) {
            resolvedRate = parseDecimalPtBr(respondedMatch[1]);
          }

          let totalComplaints = null;
          const totalComplaintsMatch = compactText.match(/recebeu([0-9.]+)reclamacoes/i);
          if (totalComplaintsMatch) {
            totalComplaints = parseIntegerPtBr(totalComplaintsMatch[1]);
          }

          const averageRating = reputationScore !== null ? reputationScore / 2 : null;

          const topComplaints = [];
          const complaintElements = document.querySelectorAll('[class*="complaint"], [class*="category"]');
          for (let i = 0; i < Math.min(3, complaintElements.length); i++) {
            const text = complaintElements[i].textContent?.trim();
            if (text && text.length > 3 && text.length < 50) {
              topComplaints.push(text);
            }
          }

          return {
            reputationScore,
            resolvedRate,
            averageRating,
            totalComplaints,
            topComplaints,
            pageTitle: document.title,
            bodyText: bodyText.substring(0, 600),
          };
        })();
      `) as {
        reputationScore: number | null;
        resolvedRate: number | null;
        averageRating: number | null;
        totalComplaints: number | null;
        topComplaints: string[];
        pageTitle: string;
        bodyText: string;
      };

      if (data.reputationScore === null || data.resolvedRate === null || data.totalComplaints === null) {
        console.warn(`⚠️ Métricas incompletas para ${bankSlug}. Pulando atualização para evitar gravar valores incorretos.`);
        console.warn(`   score=${data.reputationScore}, resolved=${data.resolvedRate}, complaints=${data.totalComplaints}`);
        console.warn(`   amostraTexto="${data.bodyText}"`);
        await page.close();
        return null;
      }

      // Processar dados extraídos
      const result: ReclameAquiRealData = {
        bankName: bankSlug,
        reputationScore: data.reputationScore,
        resolvedRate: data.resolvedRate,
        averageRating: data.averageRating ?? data.reputationScore / 2,
        totalComplaints: data.totalComplaints,
        responseTime: this.estimateResponseTime(data.resolvedRate),
        topComplaints: data.topComplaints.length > 0 ? data.topComplaints : ['Atendimento', 'App', 'Suporte'],
        sentimentScore: this.calculateSentiment(data.reputationScore, data.resolvedRate),
        lastUpdate: new Date(),
      };

      console.log(`✅ Dados coletados: ${bankSlug}`);
      console.log(`   Reputação: ${result.reputationScore}/10`);
      console.log(`   Resolução: ${result.resolvedRate}%`);
      console.log(`   Reclamações: ${result.totalComplaints}`);

      await page.close();
      return result;

    } catch (error) {
      console.error(`❌ Erro ao fazer scraping de ${bankSlug}:`, error);
      await page.close();
      return null;
    }
  }

  /**
   * Scrape todos os bancos
   */
  async scrapeAllBanks(): Promise<Map<string, ReclameAquiRealData>> {
    const results = new Map<string, ReclameAquiRealData>();

    await this.initialize();

    for (const slug of Object.keys(RECLAMEAQUI_URLS)) {
      try {
        const data = await this.scrapeBankData(slug);
        if (data) {
          results.set(slug, data);
        }

        // Rate limiting: aguardar 3-5 segundos entre requisições
        await this.sleep(3000 + Math.random() * 2000);

      } catch (error) {
        console.error(`❌ Erro ao processar ${slug}:`, error);
      }
    }

    await this.close();
    return results;
  }

  /**
   * Estimar tempo de resposta baseado na taxa de resolução
   */
  private estimateResponseTime(resolvedRate: number): number {
    // Quanto maior a resolução, menor o tempo de resposta
    if (resolvedRate >= 85) return 2 + Math.random() * 1; // 2-3h
    if (resolvedRate >= 75) return 3 + Math.random() * 2; // 3-5h
    if (resolvedRate >= 65) return 5 + Math.random() * 3; // 5-8h
    return 8 + Math.random() * 4; // 8-12h
  }

  /**
   * Calcular sentimento baseado nas métricas
   */
  private calculateSentiment(reputation: number, resolved: number): number {
    // Fórmula: (reputation/10 * 0.6) + (resolved/100 * 0.4)
    // Resultado normalizado para -1 a +1
    const score = (reputation / 10) * 0.6 + (resolved / 100) * 0.4;
    return score * 2 - 1; // Normalizar para -1 a +1
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton
export const reclameAquiScraperReal = new ReclameAquiScraper();
