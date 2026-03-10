/**
 * Email service stub for demo purposes.
 * Logs email notifications to console to simulate sending.
 * Structured for future real email integration (e.g., SendGrid, SES).
 */

interface PriceDropEmailData {
    productName: string;
    originalPrice: number;
    currentPrice: number;
    priceDrop: number; // percentage
}

interface StockAlertEmailData {
    productName: string;
    price: number;
}

function sendEmail(to: string, subject: string, body: string): void {
    console.log('=== [Email Service Stub] ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    console.log('===========================');
}

export function sendPriceDropEmail(email: string, data: PriceDropEmailData): void {
    const subject = `Price Drop Alert: ${data.productName}`;
    const body = [
        `Good news! The price of "${data.productName}" has dropped by ${data.priceDrop.toFixed(0)}%.`,
        `Original price: $${data.originalPrice.toFixed(2)}`,
        `Current price: $${data.currentPrice.toFixed(2)}`,
        ``,
        `Visit OctoCAT Supply to grab this deal!`
    ].join('\n');
    sendEmail(email, subject, body);
}

export function sendStockAlertEmail(email: string, data: StockAlertEmailData): void {
    const subject = `Back in Stock: ${data.productName}`;
    const body = [
        `"${data.productName}" is now back in stock!`,
        `Price: $${data.price.toFixed(2)}`,
        ``,
        `Visit OctoCAT Supply to purchase before it sells out again!`
    ].join('\n');
    sendEmail(email, subject, body);
}
