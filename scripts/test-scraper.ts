import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

/**
 * Teste rápido do scraper real
 */

async function testScraper() {
  console.log('🧪 Testando scraper REAL do Reclame Aqui...\n');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('📊 Coletando dados do Nubank...');
    console.log('🔗 URL: https://www.reclameaqui.com.br/empresa/nu-pagamentos-sa-nubank/\n');
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );
    
    console.log('🌐 Navegando para o site...');
    await page.goto('https://www.reclameaqui.com.br/empresa/nu-pagamentos-sa-nubank/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    console.log('⏳ Aguardando 3 segundos...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('📥 Extraindo dados...');
    const data = await page.evaluate(() => {
      const extractNumber = (text: string): number => {
        const match = text.match(/[\d,\.]+/);
        return match ? parseFloat(match[0].replace(',', '.')) : 0;
      };
      
      // Reputação
      let reputationScore = 0;
      const repEl = document.querySelector('[class*="reputation"]') || 
                    document.querySelector('[class*="score"]');
      if (repEl) {
        const text = repEl.textContent || '';
        if (text.includes('RA')) {
          const match = text.match(/RA(\d+)/);
          if (match) reputationScore = parseInt(match[1]) / 100;
        } else {
          reputationScore = extractNumber(text);
        }
      }
      
      // Taxa de resolução
      let resolvedRate = 0;
      const elements = document.querySelectorAll('span, div, p');
      for (const el of Array.from(elements)) {
        const text = el.textContent || '';
        if (text.includes('%') && text.toLowerCase().includes('resol')) {
          resolvedRate = extractNumber(text);
          break;
        }
      }
      
      // Total reclamações
      let totalComplaints = 0;
      for (const el of Array.from(elements)) {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('reclamações')) {
          const match = text.match(/[\d\.]+/);
          if (match) {
            totalComplaints = parseInt(match[0].replace('.', ''));
            break;
          }
        }
      }
      
      return {
        reputationScore,
        resolvedRate,
        totalComplaints,
        pageTitle: document.title,
      };
    });
    
    const averageRating = data.reputationScore / 2;
    const responseTime = data.resolvedRate >= 80 ? 3 : 5;
    const sentimentScore = (data.reputationScore / 10) * 0.6 + (data.resolvedRate / 100) * 0.4;
    
    if (data.reputationScore > 0 || data.resolvedRate > 0) {
      console.log('✅ Dados coletados com sucesso!\n');
      console.log('📈 Resultados:');
      console.log('─'.repeat(50));
      console.log(`Reputação:        ${data.reputationScore.toFixed(1)}/10`);
      console.log(`Resolução:        ${data.resolvedRate.toFixed(1)}%`);
      console.log(`Nota Média:       ${averageRating.toFixed(1)}/5 ⭐`);
      console.log(`Reclamações:      ${data.totalComplaints.toLocaleString('pt-BR')}`);
      console.log(`Tempo Resposta:   ~${responseTime}h`);
      console.log(`Sentimento:       ${sentimentScore.toFixed(2)}`);
      console.log('─'.repeat(50));
      
      console.log('\n✨ Teste concluído com sucesso!');
      console.log('\n💡 Próximos passos:');
      console.log('   1. Execute: npx ts-node scripts/update-reputation-real.ts');
      console.log('   2. Configure automático: .\\scripts\\setup-reputation-real-3x.ps1\n');
    } else {
      console.log('⚠️  Dados não encontrados ou estrutura do site mudou');
      console.log('💡 Pode ser necessário atualizar os seletores CSS\n');
      console.log('Debug - Título da página:', data.pageTitle);
    }
    
  } catch (error) {
    console.error('\n❌ Erro ao testar scraper:', error);
  } finally {
    await browser.close();
  }
}

testScraper();
