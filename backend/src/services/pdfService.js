const puppeteer = require('puppeteer')

class PDFService {
  constructor() {
    this.browser = null
    this.launchOptions = null
  }

  async init() {
    if (this.browser) return
    // Build launch options safely for containerized envs
    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      process.env.CHROMIUM_PATH ||
      (puppeteer.executablePath ? puppeteer.executablePath() : undefined)
    this.launchOptions = {
      headless: 'new',
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-infobars',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--window-size=1280,1024',
      ],
    }

    this.browser = await puppeteer.launch(this.launchOptions)
    // Auto-reset on disconnect so next call relaunches
    this.browser.on('disconnected', () => {
      this.browser = null
    })
  }

  async relaunch() {
    try {
      if (this.browser) {
        await this.browser.close()
      }
    } catch (_) {
      /* ignore */
    }
    this.browser = null
    await this.init()
  }

  async withPage(renderFn) {
    await this.init()
    const page = await this.browser.newPage()
    try {
      return await renderFn(page)
    } finally {
      await page.close()
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
}

module.exports = PDFService
