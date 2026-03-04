const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const abcPath = path.join(__dirname, '../Proxy Files/ABC Proxy List All with Random attachment.txt');
const dataImpulsePath = path.join(__dirname, '../Proxy Files/proxy DataImpulse All Country (Without Flag).txt');

const abcText = fs.readFileSync(abcPath, 'utf8');
const dataImpulseText = fs.readFileSync(dataImpulsePath, 'utf8');

const abcProxies = [];
const dataImpulseProxies = [];

// Parse DataImpulse
const dataImpulseParsed = JSON.parse(dataImpulseText);
Object.entries(dataImpulseParsed).forEach(([key, value]) => {
    let country = key;
    const match = key.match(/🏳️\s*(.*?)\s*🏳️/);
    if (match && match[1]) {
        country = match[1];
    } else {
        country = country.replace(/DataImpulse/i, '').trim();
    }
    dataImpulseProxies.push({
        country: country.trim() || 'Unknown',
        proxy: String(value),
    });
});

// Parse ABC
const lines = abcText.split('\n');
for (const line of lines) {
    const match = line.match(/\/set_proxy\s+(\{.*?\})/);
    if (match && match[1]) {
        try {
            const obj = JSON.parse(match[1]);
            Object.entries(obj).forEach(([key, value]) => {
                if (key.toUpperCase() !== 'RANDOM') {
                    abcProxies.push({
                        country: key.trim(),
                        proxy: String(value),
                    });
                }
            });
        } catch (err) { }
    }
}

const outputPath = path.join(__dirname, '../src/app/proxy-manager/proxyData.ts');
const fileContent = `export interface ProxyEntry {
    country: string;
    proxy: string;
}

export const abcProxies: ProxyEntry[] = ${JSON.stringify(abcProxies, null, 4)};

export const dataImpulseProxies: ProxyEntry[] = ${JSON.stringify(dataImpulseProxies, null, 4)};
`;

fs.writeFileSync(outputPath, fileContent);
console.log('Generated proxyData.ts — ABC: ' + abcProxies.length + ', DataImpulse: ' + dataImpulseProxies.length);
