
import { TAWREED_BASE_URL } from '../constants.ts';
import { TawreedProduct } from '../types.ts';

/**
 * STRICT NAME NORMALIZATION
 * As per master prompt: lowercase, trim, remove dots and extra symbols.
 */
function normalizeName(name: string): string {
    if (!name) return "";
    return name
        .toLowerCase()
        .replace(/\./g, '') // Remove dots
        .replace(/[()\[\]\-\/\\,]/g, ' ') // Remove symbols
        .replace(/\s+/g, ' ') // Collapse spaces
        .trim();
}

function parseWebhookResponse(text: string): TawreedProduct[] {
    const products: TawreedProduct[] = [];
    const lines = text.split('\n');
    let currentProduct: Partial<TawreedProduct> | null = null;
    let indexCounter = 0;

    for (let line of lines) {
        line = line.trim();
        const nameMatch = line.match(/^\d+️⃣\s*\*(.+)\*$/);
        if (nameMatch) {
            if (currentProduct && currentProduct.productName) {
                products.push(currentProduct as TawreedProduct);
            }
            indexCounter++;
            currentProduct = {
                productId: `tw_${indexCounter}`,
                productName: nameMatch[1],
                stores: [], 
                totalQty: 0,
                avgDiscount: null,
                bestSale: null
            };
            continue;
        }

        if (currentProduct) {
            if (line.includes('أفضل سعر')) {
                const priceMatch = line.match(/أفضل سعر:\s*([\d.]+)/);
                if (priceMatch) currentProduct.bestSale = parseFloat(priceMatch[1]);
            }
            if (line.includes('خصم')) {
                const discountMatch = line.match(/خصم:\s*([\d.]+)%/);
                if (discountMatch) currentProduct.avgDiscount = parseFloat(discountMatch[1]);
            }
            if (line.includes('كمية متاحة')) {
                const qtyMatch = line.match(/كمية متاحة:\s*(\d+)/);
                if (qtyMatch) currentProduct.totalQty = parseInt(qtyMatch[1], 10);
            }
        }
    }
    if (currentProduct && currentProduct.productName) products.push(currentProduct as TawreedProduct);
    return products;
}

export async function checkDrugAvailability(originalName: string): Promise<TawreedProduct[]> {
    const query = normalizeName(originalName);
    if (!query || query.length < 2) return [];

    try {
        const formData = new URLSearchParams();
        formData.append('Body', query);
        formData.append('From', 'WebClient');

        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(TAWREED_BASE_URL)}`;
        
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData
        });

        if (!response.ok) return [];

        const xmlText = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");
        const messageText = xmlDoc.getElementsByTagName("Message")[0]?.textContent || "";

        if (!messageText || messageText.includes("لم يتم العثور")) return [];

        return parseWebhookResponse(messageText);
    } catch (e) {
        return [];
    }
}
