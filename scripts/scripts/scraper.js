   const axios = require('axios');  // 引入axios，抓取网页
   const cheerio = require('cheerio');  // 引入cheerio，解析HTML
   const fs = require('fs');  // 引入文件系统，保存结果
   const path = require('path');  // 引入路径模块，处理文件路径

   // 要抓取的网站列表（根据您的需求调整，添加或删除）
   const websites = [
     'https://www.instrument.com.cn',  // 仪器信息网（示例，实际可能需要调整URL）
     'https://www.thermofisher.com',  // 赛默飞官网（示例）
     'https://www.bruker.com',        // 布鲁克官网（示例）
     'https://www.fossanalytics.com', // FOSS官网（示例）
     'https://www.buchi.com',         // 步琦官网（示例）
     'https://www.fpi.cn'            // 聚光科技官网（示例）
   ];

   // 生成md文件（关键：生成固定名称的`latest.md`，覆盖旧文件）
   function generateMarkdown(results) {
     const filename = path.join('data', 'latest.md');  // 固定名称，每天覆盖
     
     // 确保data目录存在（如果没有，创建它）
     if (!fs.existsSync('data')) {
       fs.mkdirSync('data');
     }
     
     // 写入文件内容（Markdown表格，包含您要求的所有字段）
     let content = `# 近红外光谱研究动态\n\n`;
     content += '| 序号 | 来源 | 发布时间 | 标题 | 应用对象 | 主题 | 研究重点 | 技术方法 | 创新 | 链接 | 备注 |\n';
     content += '|------|------|----------|------|----------|------|----------|----------|------|------|------|\n';
     
     // 把抓取的结果填入表格
     results.forEach((result, index) => {
       content += `| ${index + 1} | ${result.source} | ${result.date} | ${result.title} | ${result.application} | ${result.topic} | ${result.focus} | ${result.method} | ${result.innovation} | [链接](${result.link}) | |\n`;
     });
     
     // 保存文件（覆盖旧文件）
     fs.writeFileSync(filename, content, 'utf-8');
     console.log(`结果已保存到 ${filename}`);
   }

   // 抓取单个网站（根据网站结构调整解析逻辑）
   async function scrapeWebsite(url) {
     try {
       // 发送GET请求抓取网页
       const response = await axios.get(url);
       const $ = cheerio.load(response.data);  // 用cheerio解析HTML
       
       const articles = [];  // 存放该网站的文章
       
       // **重要**：根据实际网站调整以下选择器（示例，需要根据网站结构调整）
       // 例如，仪器信息网的文章可能在一个class为"article-list"的div里
       $('.article-list .article-item').each((index, element) => {  // 示例选择器，实际可能不同
         const title = $(element).find('h3').text().trim();  // 文章标题
         const link = $(element).find('a').attr('href');  // 文章链接
         const date = $(element).find('.date').text().trim();  // 发布时间
         
         // 只抓取包含关键词的文章（近红外光谱、农产品、模型、光谱仪）
         const keywords = ['近红外光谱', '农产品', '模型', '光谱仪'];
         if (title && link && keywords.some(keyword => title.includes(keyword))) {
           articles.push({
             title,
             link: link.startsWith('http') ? link : new URL(link, url).href,  // 处理相对链接
             date,
             source: new URL(url).hostname  // 来源网站域名
           });
         }
       });
       
       return articles;
     } catch (error) {
       console.error(`抓取${url}失败：`, error.message);  // 如果出错，打印错误
       return [];
     }
   }

   // 主函数（执行所有步骤）
   async function main() {
     const allResults = [];  // 存放所有网站的文章
     
     // 循环抓取每个网站
     for (const website of websites) {
       const articles = await scrapeWebsite(website);
       allResults.push(...articles);  // 把该网站的文章加入总列表
     }
     
     // 生成md文件（覆盖旧文件）
     generateMarkdown(allResults);
   }

   main();  // 运行主函数
   
