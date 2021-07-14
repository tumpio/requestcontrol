import fs from "fs";
import path from "path";

import { createMatchPatterns, createRule } from "../src/main/api";

test("Create rules", async () => {
    const files = await readRuleFiles();
    const rules = files.flatMap((file) => file.map(createRule));
    expect(rules.length).toBeGreaterThan(0);
});

test("Create match patterns", async () => {
    const files = await readRuleFiles();
    const allPatterns = files.flatMap((file) =>
        file.flatMap((rule) => {
            const patterns = createMatchPatterns(rule.pattern);
            expect(patterns.length).toBeGreaterThan(0);
            return patterns;
        })
    );
    expect(allPatterns.length).toBeGreaterThan(0);
});

async function readRuleFiles() {
    const imports = fs
        .readdirSync("./rules")
        .filter((name) => path.extname(name) === ".json")
        .map((name) => path.join("../rules", name))
        .map((path) => import(path));
    const files = await Promise.all(imports);
    return files.map((module) => module.default).map((rules) => (Array.isArray(rules) ? rules : [rules]));
}
