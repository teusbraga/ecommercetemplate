// tests/selenium/products.test.ts
import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome';

(async () => {
  const options = new chrome.Options();
  options.addArguments('--headless=new');

  const driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
  try {
    await driver.get('http://localhost:3000/products');
    const first = await driver.wait(until.elementLocated(By.css('[data-testid^="product-view-"]')), 5000);
    await first.click();
    const modal = await driver.wait(until.elementLocated(By.css('[data-testid="product-modal"]')), 5000);
    if (!(await modal.isDisplayed())) throw new Error('Modal não apareceu');
    await driver.findElement(By.css('[data-testid="add-to-cart"]')).click();
    await driver.findElement(By.css('[data-testid="modal-close"]')).click();
  } finally {
    await driver.quit();
  }
})();