
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "frontend", "src");
const changed = [];

function walk(directory) {
    for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
        const fullPath = path.join(directory, item.name);

        if (item.isDirectory()) {
            walk(fullPath);
        } else if (/\.(js|jsx)$/.test(item.name)) {
            if (["api.js", "productImages.js"].includes(item.name)) continue;

            let content = fs.readFileSync(fullPath, "utf8");
            const original = content;

            content = content.replace(
                /"http:\/\/localhost:5000([^"]*)"/g,
                (_, suffix) => `\`${"${API_BASE_URL}"}${suffix}\``
            );

            content = content.replace(
                /'http:\/\/localhost:5000([^']*)'/g,
                (_, suffix) => `\`${"${API_BASE_URL}"}${suffix}\``
            );

            content = content.replace(
                /`http:\/\/localhost:5000/g,
                `\`${"${API_BASE_URL}"}`
            );

            if (content !== original) {
                const relative = path.relative(root, fullPath).split(path.sep).join("/");
                const directory = path.posix.dirname(relative);
                let importPath = path.posix.relative(directory, "utils/api");

                if (!importPath.startsWith(".")) {
                    importPath = "./" + importPath;
                }

                content = `import API_BASE_URL from "${importPath}";\n${content}`;

                fs.writeFileSync(fullPath, content, "utf8");
                changed.push(relative);
            }
        }
    }
}

walk(root);

console.log("Updated files:");
changed.forEach(file => console.log(" - " + file));
console.log(`\nTotal updated: ${changed.length}`);
