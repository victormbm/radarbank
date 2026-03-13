import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());

/**
 * Teste simplificado para verificar acesso ao Reclame Aqui
 */

async function simpleTest() {
  console.log('🧪 Teste Simples: Verificando acesso ao Reclame Aqui\n');
  
  const browser = await puppeteer.launch({
    headless: true, // Headless mode
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--window-size=1920,1080'
    ],
  });
  
  try {
    const page = await browser.newPage();
    
    // Configurar viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    // User agent real
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    
    // Headers extras
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    });
    
    // Primeiro, testar acesso à homepage
    console.log('1️⃣  Testando acesso à homepage do Reclame Aqui...');
    await page.goto('https://www.reclameaqui.com.br/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const homeTitle = await page.title();
    console.log('   ✅ Homepage carregou:', homeTitle);
    
    // Agora tentar acessar página do Nubank
    console.log('\n2️⃣  Testando acesso à página do Nubank...');
    const targetUrl = 'https://www.reclameaqui.com.br/empresa/nu-pagamentos-sa-nubank/';
    
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const pageTitle = await page.title();
    console.log('   ✅ Página do Nubank carregou:', pageTitle);
    
    // Capturar informações básicas
    const pageInfo = await page.evaluate(() => {
      const body = document.body;
      const allText = body.textContent || '';
      
      return {
        title: document.title,
        bodyLength: allText.length,
        hasNubank: allText.toLowerCase().includes('nubank'),
        hasReclamações: allText.toLowerCase().includes('reclamaç'),
        hasReputação: allText.toLowerCase().includes('reputa'),
        textPreview: allText.substring(0, 500)
      };
    });
    
    console.log('\n📊 Análise da Página:');
    console.log('   Tamanho do conteúdo:', pageInfo.bodyLength, 'caracteres');
    console.log('   Menciona "Nubank":', pageInfo.hasNubank ? 'Sim ✅' : 'Não ❌');
    console.log('   Menciona "Reclamações":', pageInfo.hasReclamações ? 'Sim ✅' : 'Não ❌');
    console.log('   Menciona "Reputação":', pageInfo.hasReputação ? 'Sim ✅' : 'Não ❌');
    
    if (pageInfo.bodyLength < 1000) {
      console.log('\n⚠️  ATENÇÃO: Página com pouco conteúdo. Possível bloqueio.');
      console.log('\n📝 Preview do texto:');
      console.log(pageInfo.textPreview);
    }
    
    // Salvar HTML
    const html = await page.content();
    const htmlPath = 'c:\\Dev\\Radar-Bank\\reclameaqui-page.html';
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`\n💾 HTML salvo para inspeção: ${htmlPath}`);
    
    // Salvar screenshot se possível
    try {
      const screenshotPath = 'c:\\Dev\\Radar-Bank\\reclameaqui-screenshot.png';
      await page.screenshot({ path: screenshotPath, fullPage: false });
      console.log(`📸 Screenshot salvo: ${screenshotPath}`);
    } catch (e) {
      console.log('⚠️  Não foi possível salvar screenshot');
    }
    
    // Se chegou aqui, vamos procurar os dados
    console.log('\n3️⃣  Procurando dados de reputação...');
    
    const scrapedData = await page.evaluate(() => {
      const allText = document.body.textContent || '';
      
      // Procurar por padrões de score (ex: "8.6", "8,6")
      const scoreMatches = allText.match(/\b[6-9][.,]\d\b/g);
      
      // Procurar por percentuais (ex: "81.2%", "81%")
      const percentMatches = allText.match(/\b\d{1,2}[.,]?\d?%/g);
      
      // Procurar por números grandes (reclamações, ex: "45.230")
      const largeNumbers = allText.match(/\b\d{1,3}\.\d{3}\b/g);
      
      return {
        possibleScores: scoreMatches?.slice(0, 10) || [],
        possiblePercents: percentMatches?.slice(0, 10) || [],
        possibleComplaints: largeNumbers?.slice(0, 10) || []
      };
    });
    
    console.log('\n🔍 Dados encontrados:');
    console.log('   Possíveis scores:', scrapedData.possibleScores);
    console.log('   Possíveis %:', scrapedData.possiblePercents);
    console.log('   Possíveis reclamações:', scrapedData.possibleComplaints);
    
    if (scrapedData.possibleScores.length > 0) {
      console.log('\n✅ SUCESSO! Dados numéricos encontrados na página.');
      console.log('💡 Agora preciso identificar os seletores corretos.');
      console.log('📝 Inspecione o arquivo HTML salvo para encontrar os elementos exatos.');
    } else {
      console.log('\n⚠️  Nenhum dado numérico encontrado.');
      console.log('💡 Possível bloqueio ou mudança na estrutura do site.');
    }
    
  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
    
    if (error.message.includes('net::ERR_')) {
      console.log('\n💡 Erro de rede. Verifique sua conexão com a internet.');
    } else if (error.message.includes('timed out')) {
      console.log('\n💡 Timeout. O site pode estar bloqueando o acesso.');
    } else if (error.message.includes('Session closed')) {
      console.log('\n💡 Sessão fechada. O site pode ter detectado o bot.');
    }
    
  } finally {
    await browser.close();
    console.log('\n🚪 Navegador fechado.');
  }
}

simpleTest();
