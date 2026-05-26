import { loadDocs, saveDocs } from './storage';
import { parseTxt, getFileInfo } from '../parsers/txt';
import { parseDocx } from '../parsers/docx';
import { parseXlsx } from '../parsers/xlsx';
import { extname } from 'path';

interface ImportedDoc {
  id: string;
  fileName: string;
  originalPath: string;
  fileType: 'txt' | 'docx' | 'xlsx';
  content: string;
  contentPreview: string;
  category: string;
  tags: string[];
  fileSize: number;
  importedAt: number;
}

function generateId(): string {
  // Simple nanoid-like ID without extra dependency in main process
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function classifyDocument(content: string, fileName: string): { category: string; tags: string[] } {
  const combined = (content + ' ' + fileName).toLowerCase();
  const tags: string[] = [];

  // Category rules
  if (/vpn|virtual|nat|隧道|代理/.test(combined)) {
    return { category: 'VPN访问', tags: extractTags(combined) };
  }
  if (/邮箱|email|mail|smtp|pop|imap|exchange/.test(combined)) {
    return { category: '邮箱', tags: extractTags(combined) };
  }
  if (/教务|选课|成绩|学分|课程|教学|培养/.test(combined)) {
    return { category: '教务系统', tags: extractTags(combined) };
  }
  if (/图书馆|文献|论文|期刊|数据库|电子书/.test(combined)) {
    return { category: '图书馆', tags: extractTags(combined) };
  }
  if (/财务|报销|工资|薪|经费|预算|发票/.test(combined)) {
    return { category: '财务系统', tags: extractTags(combined) };
  }
  if (/人事|oa|办公|考勤|审批|公告/.test(combined)) {
    return { category: 'OA办公', tags: extractTags(combined) };
  }
  if (/门户|portal|信息平台|统一认证|单点|sso/.test(combined)) {
    return { category: '门户系统', tags: extractTags(combined) };
  }
  if (/一卡通|校园卡|饭卡|门禁|消费/.test(combined)) {
    return { category: '一卡通', tags: extractTags(combined) };
  }
  if (/宿舍|公寓|住宿|寝室/.test(combined)) {
    return { category: '宿舍管理', tags: extractTags(combined) };
  }

  return { category: '其他文档', tags: extractTags(combined) };
}

function extractTags(combined: string): string[] {
  const tags: string[] = [];
  if (/登录|账号|密码|用户名|口令|认证/.test(combined)) tags.push('登录凭证');
  if (/网址|url|地址|链接|http|https|www\./.test(combined)) tags.push('网址链接');
  if (/电话|手机|座机|联系方式/.test(combined)) tags.push('联系方式');
  if (/流程|步骤|教程|说明|指南|操作/.test(combined)) tags.push('操作指南');
  return tags;
}

function makePreview(content: string, maxLen = 200): string {
  return content.slice(0, maxLen).replace(/\s+/g, ' ').trim();
}

async function parseFile(filePath: string): Promise<{ content: string; fileType: ImportedDoc['fileType'] }> {
  const ext = extname(filePath).toLowerCase();

  switch (ext) {
    case '.txt': {
      const content = parseTxt(filePath);
      return { content, fileType: 'txt' };
    }
    case '.docx':
    case '.doc': {
      const content = await parseDocx(filePath);
      return { content, fileType: 'docx' };
    }
    case '.xlsx':
    case '.xls': {
      const content = await parseXlsx(filePath);
      return { content, fileType: 'xlsx' };
    }
    default:
      throw new Error(`Unsupported file type: ${ext}`);
  }
}

export async function importFiles(filePaths: string[]): Promise<ImportedDoc[]> {
  const existingDocs = loadDocs() as ImportedDoc[];
  const newDocs: ImportedDoc[] = [];

  for (const filePath of filePaths) {
    try {
      const info = getFileInfo(filePath);
      const { content, fileType } = await parseFile(filePath);
      const { category, tags } = classifyDocument(content, info.fileName);

      const doc: ImportedDoc = {
        id: generateId(),
        fileName: info.fileName,
        originalPath: filePath,
        fileType,
        content,
        contentPreview: makePreview(content),
        category,
        tags,
        fileSize: info.fileSize,
        importedAt: Date.now(),
      };

      newDocs.push(doc);
    } catch (err: any) {
      console.error(`Failed to import ${filePath}:`, err.message);
    }
  }

  const allDocs = [...existingDocs, ...newDocs];
  saveDocs(allDocs);
  return newDocs;
}

export function getAllDocs(): ImportedDoc[] {
  return loadDocs() as ImportedDoc[];
}

export function getDocById(id: string): ImportedDoc | null {
  const docs = loadDocs() as ImportedDoc[];
  return docs.find((d) => d.id === id) || null;
}

export function deleteDoc(id: string): void {
  const docs = loadDocs() as ImportedDoc[];
  saveDocs(docs.filter((d) => d.id !== id));
}

export function getCategories(): string[] {
  const docs = loadDocs() as ImportedDoc[];
  const cats = new Set(docs.map((d) => d.category));
  return Array.from(cats).sort();
}

export function updateDocTags(id: string, tags: string[]): ImportedDoc | null {
  const docs = loadDocs() as ImportedDoc[];
  const doc = docs.find((d) => d.id === id);
  if (!doc) return null;
  doc.tags = tags;
  saveDocs(docs);
  return doc;
}

export function updateDocCategory(id: string, category: string): ImportedDoc | null {
  const docs = loadDocs() as ImportedDoc[];
  const doc = docs.find((d) => d.id === id);
  if (!doc) return null;
  doc.category = category;
  saveDocs(docs);
  return doc;
}

export function searchDocs(query: string) {
  const docs = loadDocs() as ImportedDoc[];
  if (!query.trim()) {
    return docs.map((doc) => ({
      doc,
      matches: [],
      score: 0,
    }));
  }

  const q = query.toLowerCase();
  const results: Array<{
    doc: ImportedDoc;
    matches: Array<{ snippet: string; position: number }>;
    score: number;
  }> = [];

  for (const doc of docs) {
    const content = doc.content.toLowerCase();
    const matches: Array<{ snippet: string; position: number }> = [];
    let idx = 0;
    let score = 0;

    while (idx < content.length) {
      const pos = content.indexOf(q, idx);
      if (pos === -1) break;

      const start = Math.max(0, pos - 40);
      const end = Math.min(content.length, pos + q.length + 40);
      const snippet = doc.content.slice(start, end);
      const prefix = start > 0 ? '...' : '';
      const suffix = end < content.length ? '...' : '';

      matches.push({
        snippet: prefix + snippet + suffix,
        position: pos,
      });
      score++;
      idx = pos + q.length;
    }

    if (matches.length > 0) {
      results.push({ doc, matches: matches.slice(0, 5), score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}
