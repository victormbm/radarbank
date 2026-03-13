import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

/**
 * Buscar URL correta do Nubank no Reclame Aqui
 */

async function findNubankURL() {
  console.log('🔍 Procurando URL correta do Nubank no Reclame Aqui...\n');
  
  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    );
    
    console.log('1️⃣  Acessando homepage do Reclame Aqui...');
    await page.goto('https://www.reclameaqui.com.br/', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('   ✅ Homepage carregada');
    
    // Procurar campo de busca e pesquisar por Nubank
    console.log('\n2️⃣  Buscando por "Nubank"...');
    
    // Tentar vários seletores possíveis para o campo de busca
    const searchSelectors = [
      'input[name="q"]',
      'input[type="search"]',
      'input[placeholder*="Busca"]',
      'input[placeholder*="busca"]',
      'input[placeholder*="Pesquis"]',
      '.search-input',
      '#search',
      '[data-testid="search-input"]'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        searchInput = selector;
        break;
      } catch (e) {
        continue;
      }
    }
    
    if (searchInput) {
      await page.type(searchInput, 'Nubank');
      console.log('   ✅ Texto digitado no campo de busca');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Pressionar Enter ou clicar no botão de busca
      await page.keyboard.press('Enter');
      console.log('   ✅ Busca enviada');
      
      // Aguardar resultados
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Capturar URLs de resultados
      const results = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="empresa"], a[href*="nubank"]'));
        return links
          .map(el => ({
            href: (el as any).href as string,
            text: el.textContent?.trim().substring(0, 100) || ''
          }))
          .filter(item => item.href.includes('empresa'))
          .slice(0, 5);
      });
      
      console.log('\n3️⃣  Resultados encontrados:');
      if (results.length > 0) {
        results.forEach((result, index) => {
          console.log(`\n   ${index + 1}. ${result.text}`);
          console.log(`      ${result.href}`);
        });
        
        // Usar o primeiro resultado
        if (results[0]) {
          console.log('\n4️⃣  Testando primeiro resultado...');
          await page.goto(results[0].href, {
            waitUntil: 'networkidle2',
            timeout: 30000,
          });
          
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const pageData = await page.evaluate(() => {
            return {
              title: document.title,
              url: window.location.href,
              bodyText: document.body.textContent?.substring(0, 300)
            };
          });
          
          console.log(`\n   ✅ Página carregada: ${pageData.title}`);
          console.log(`   🔗 URL: ${pageData.url}`);
          console.log(`\n   📝 Preview: ${pageData.bodyText}`);
          
          console.log('\n═'.repeat(60));
          console.log('✅ URL CORRETA ENCONTRADA!');
          console.log(`🔗 ${pageData.url}`);
          console.log('═'.repeat(60));
        }
      } else {
        console.log('\n   ⚠️  Nenhum resultado encontrado');
      }
    } else {
      console.log('   ⚠️  Campo de busca não encontrado');
      console.log('\n   💡 Você pode procurar manualmente no navegador aberto.');
    }
    
    console.log('\n⏸️  Navegador permanecerá aberto por 30 segundos...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error: any) {
    console.error('\n❌ Erro:', error.message);
  } finally {
    await browser.close();
    console.log('\n🚪 Navegador fechado.');
  }
}

findNubankURL();
