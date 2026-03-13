import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as fs from 'fs';

puppeteer.use(StealthPlugin());

/**
 * Debug script para explorar estrutura do Reclame Aqui
 */

async function debugReclameAqui() {
  console.log('🔍 DEBUG: Explorando estrutura do Reclame Aqui...\n');
  
  const browser = await puppeteer.launch({
    headless: false, // Modo visível para debug
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--window-size=1920,1080'
    ],
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    const url = 'https://www.reclameaqui.com.br/empresa/nu-pagamentos-sa-nubank/';
    console.log('🔗 Navegando para:', url);
    console.log('⏳ Aguarde, página carregando...\n');
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );
    
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    
    // Esperar carregamento de conteúdo dinâmico
    console.log('⏳ Aguardando 8 segundos para carregar conteúdo dinâmico...');
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    // Capturar screenshot
    const screenshotPath = 'c:\\Dev\\Radar-Bank\\debug-screenshot.png';
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot salvo: ${screenshotPath}\n`);
    
    // Capturar título
    const title = await page.title();
    console.log('📄 Título da página:', title);
    
    // Explorar estrutura HTML
    const pageInfo = await page.evaluate(() => {
      // Encontrar todos os elementos que parecem conter pontuação/score
      const findScoreElements = () => {
        const results: any[] = [];
        
        // Procurar elementos com classes relacionadas a score
        const scoreClasses = ['score', 'nota', 'reputation', 'rating', 'pontuacao'];
        for (const className of scoreClasses) {
          const elements = Array.from(document.querySelectorAll(`[class*="${className}"]`));
          if (elements.length > 0) {
            results.push({
              searchTerm: className,
              found: elements.length,
              sample: elements.slice(0, 3).map(el => ({
                tag: el.tagName,
                class: el.className,
                text: el.textContent?.substring(0, 100),
                innerHTML: el.innerHTML.substring(0, 200)
              }))
            });
          }
        }
        
        return results;
      };
      
      // Procurar números que parecem scores (8.6, 81%, etc)
      const findNumericPatterns = () => {
        const text = document.body.textContent || '';
        const patterns = {
          scorePattern: text.match(/\b[7-9]\.[0-9]\b/g) || [],
          percentPattern: text.match(/\b\d{1,2}(\.\d)?%/g) || [],
          largeNumbers: text.match(/\b\d{1,3}\.\d{3}\b/g) || []
        };
        return patterns;
      };
      
      // Procurar por data-testid, data-cy, ou outros atributos de teste
      const findTestAttributes = () => {
        const testAttrs = ['data-testid', 'data-cy', 'data-test', 'id'];
        const results: any = {};
        
        for (const attr of testAttrs) {
          const elements = Array.from(document.querySelectorAll(`[${attr}]`));
          if (elements.length > 0) {
            results[attr] = elements.slice(0, 5).map(el => ({
              attribute: el.getAttribute(attr),
              tag: el.tagName,
              text: el.textContent?.substring(0, 50)
            }));
          }
        }
        
        return results;
      };
      
      return {
        url: window.location.href,
        title: document.title,
        scoreElements: findScoreElements(),
        numericPatterns: findNumericPatterns(),
        testAttributes: findTestAttributes(),
        bodyLength: document.body.innerHTML.length,
        hasReact: !!(window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__,
        hasNextjs: !!(window as any).__NEXT_DATA__
      };
    });
    
    // Salvar HTML completo
    const htmlPath = 'c:\\Dev\\Radar-Bank\\debug-page.html';
    const html = await page.content();
    fs.writeFileSync(htmlPath, html, 'utf-8');
    console.log(`💾 HTML completo salvo: ${htmlPath}\n`);
    
    // Exibir resultados
    console.log('═'.repeat(60));
    console.log('📊 ANÁLISE DA PÁGINA');
    console.log('═'.repeat(60));
    
    console.log('\n🔢 Padrões Numéricos Encontrados:');
    console.log('  Scores (7-9.x):', pageInfo.numericPatterns.scorePattern.slice(0, 5));
    console.log('  Percentuais:', pageInfo.numericPatterns.percentPattern.slice(0, 5));
    console.log('  Números grandes:', pageInfo.numericPatterns.largeNumbers.slice(0, 5));
    
    console.log('\n🎯 Elementos com classes de Score:');
    for (const item of pageInfo.scoreElements) {
      console.log(`\n  Busca por "${item.searchTerm}": ${item.found} elementos`);
      if (item.sample.length > 0) {
        console.log('  Amostra:');
        for (const el of item.sample) {
          console.log(`    - <${el.tag}> class="${el.class}"`);
          console.log(`      Texto: ${el.text?.trim()}`);
        }
      }
    }
    
    console.log('\n🔖 Atributos de Teste:');
    for (const [attr, elements] of Object.entries(pageInfo.testAttributes)) {
      console.log(`\n  ${attr}: ${(elements as any).length} elementos`);
      for (const el of (elements as any).slice(0, 3)) {
        console.log(`    - ${el.attribute}: ${el.text?.trim()}`);
      }
    }
    
    console.log('\n🌐 Info Técnica:');
    console.log(`  Framework React: ${pageInfo.hasReact ? 'Sim' : 'Não'}`);
    console.log(`  Framework Next.js: ${pageInfo.hasNextjs ? 'Sim' : 'Não'}`);
    console.log(`  Tamanho HTML: ${(pageInfo.bodyLength / 1024).toFixed(1)} KB`);
    
    console.log('\n═'.repeat(60));
    console.log('✅ Debug concluído!');
    console.log('\n💡 Arquivos gerados:');
    console.log(`   - Screenshot: ${screenshotPath}`);
    console.log(`   - HTML: ${htmlPath}`);
    console.log('\n⏸️  Navegador permanecerá aberto por 30 segundos para inspeção...');
    
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } catch (error) {
    console.error('\n❌ Erro:', error);
  } finally {
    await browser.close();
    console.log('\n🚪 Navegador fechado.');
  }
}

debugReclameAqui();
