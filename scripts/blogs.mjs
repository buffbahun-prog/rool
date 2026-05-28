import fs from "fs-extra";
import path from "path";
import MarkdownIt from "markdown-it";
import texmath from "markdown-it-texmath";
import katex from "katex";
import { createHighlighter } from "shiki";
import matter from "gray-matter";

const highlighter = await createHighlighter({
  themes: ["github-dark"],
  langs: ["js", "ts", "c", "cpp", "python", "bash"],
});

const md = new MarkdownIt({
  html: true,

  highlight(code, lang) {
    return highlighter.codeToHtml(code, {
      lang: lang || "txt",
      theme: "github-dark",
    });
  },
});

md.use(texmath, {
  engine: katex,
  delimiters: "dollars",
});

const files = fs.readdirSync("./blog-posts");

const blogCards = [];

for (const file of files) {
  if (!file.endsWith(".md")) continue;

  const raw = fs.readFileSync(`./blog-posts/${file}`, "utf-8");

  const { data, content } = matter(raw);

  const {title, description, author, published, updated, tags, slug} = data;

  const html = md.render(content);

  const template = fs.readFileSync("./templates/layout.html", "utf-8");

  const finalHtml = template
    .replace("{{content}}", html)
    .replaceAll("{{title}}", title)
    .replaceAll("{{description}}", description)
    .replaceAll("{{author}}", author)
    .replaceAll("{{published}}", published)
    .replaceAll("{{updated}}", updated || published)
    .replaceAll("{{tags}}", tags.join(", "))
    .replaceAll(
      "{{canonicalUrl}}",
      `https://rool.buffbahun.workers.dev/blogs/${slug}/`
    )
    .replaceAll(
      "{{ogImage}}",
      "https://rool.buffbahun.workers.dev/assets/og/blog-og.png"
    );

  await fs.ensureDir(`./public/blogs/${slug}`);

  await fs.writeFile(
    `./public/blogs/${slug}/index.html`,
    finalHtml
  );

  const blogCardTemplate = fs.readFileSync("./templates/blog-card.html", "utf-8");
  const blogCardHtml = blogCardTemplate
    .replaceAll("{{title}}", title)
    .replaceAll("{{published}}", published)
    .replaceAll("{{description}}", description)
    .replaceAll("{{slug}}", slug);
  blogCards.push(blogCardHtml);
}

const blogTemplate = fs.readFileSync("./templates/blog-main-layout.html", "utf-8");

const blogHtml = blogTemplate
  .replaceAll("{{blogCards}}", blogCards.join("\n"));

await fs.writeFile(
  `./public/blogs/index.html`,
  blogHtml
);