import { Stagehand } from "@/dist";
import { z } from "zod";

async function example() {
  console.log("🏦 Starting Aave interaction bot...");
  const stagehand = new Stagehand({
    env: "LOCAL",
    verbose: 1,
    debugDom: true,
    // Give more time for blockchain interactions
    domSettleTimeoutMs: 2000,
    // Example: Use Chrome from a custom location
    executablePath:
      process.env.CHROME_PATH ||
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });

  try {
    console.log("🌟 Initializing Stagehand...");
    await stagehand.init();

    console.log("🌐 Navigating to Aave on Sepolia...");
    await stagehand.page.goto(
      "https://app.aave.com/?marketName=proto_base_sepolia_v3",
    );

    // Inject banner script
    await stagehand.page.addScriptTag({
      content: `
        (function() {
          const banner = document.createElement('div');
          Object.assign(banner.style, {
            position: 'fixed',
            top: '0',
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: '300px',
            height: '30px',
            lineHeight: '30px',
            background: '#4CAF50',
            color: 'white',
            textAlign: 'center',
            padding: '0 16px',
            borderRadius: '0 0 8px 8px',
            fontSize: '14px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: '9999',
            pointerEvents: 'none'
          });
          banner.textContent = 'Hello World';
          document.body.insertBefore(banner, document.body.firstChild);
        })();
      `,
    });

    console.log("⌛ Waiting for Aave interface to load...");
    // Wait for the main market container to be visible
    await stagehand.page.waitForSelector('[data-cy="markets"]', {
      timeout: 20000,
    });

    // Extract market data
    const marketData = await stagehand.page.extract({
      instruction: `Extract the current market data:
        1. Available assets
        2. Their supply and borrow APY
        3. Total market size`,
      schema: z.object({
        assets: z.array(
          z.object({
            name: z.string(),
            supplyAPY: z.string(),
            borrowAPY: z.string(),
          }),
        ),
        totalMarketSize: z.string(),
      }),
    });

    console.log("📊 Market Data:", marketData);

    console.log("✅ Aave market data extraction complete!");
  } catch (error) {
    console.error("❌ Error during Aave interaction:", error);
    throw error;
  } finally {
    await stagehand.close();
  }
}

(async () => {
  await example();
})();
