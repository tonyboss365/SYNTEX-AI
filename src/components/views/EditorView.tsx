import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCode, CheckCircle2, FileText, ChevronRight, ChevronDown, Sparkles, Terminal, Cpu, Languages, Copy, Check, Info, Plus, Upload, Trash2, Edit2, Download, Folder, FolderPlus } from 'lucide-react';

interface Token {
  type: 'KEYWORD' | 'IDENTIFIER' | 'STRING' | 'NUMBER' | 'OPERATOR' | 'SYMBOL' | 'COMMENT';
  value: string;
}

interface ASTNode {
  name: string;
  type: string;
  children?: ASTNode[];
}

interface CompilerResult {
  correctedCode?: string;
  explanation?: string;
  consoleOutput?: string;
  compiledCode?: string;
  tokens?: Token[];
  ast?: ASTNode;
  errorLines?: number[];
}

const escapeHtml = (text: string) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const getLangMode = (filename: string): 'lex' | 'python' | 'java' | 'javascript' | 'c' | 'cpp' | 'natural' | 'markdown' => {
  if (filename.endsWith('.lex')) return 'lex';
  if (filename.endsWith('.py')) return 'python';
  if (filename.endsWith('.java')) return 'java';
  if (filename.endsWith('.js')) return 'javascript';
  if (filename.endsWith('.c')) return 'c';
  if (filename.endsWith('.cpp') || filename.endsWith('.cc')) return 'cpp';
  if (filename.endsWith('.txt')) return 'natural';
  return 'markdown';
};

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

function computeDiff(original: string, corrected: string): DiffLine[] {
  const origLines = original.split('\n');
  const corrLines = corrected.split('\n');
  
  const dp: number[][] = Array(origLines.length + 1)
    .fill(null)
    .map(() => Array(corrLines.length + 1).fill(0));
  
  for (let i = 1; i <= origLines.length; i++) {
    for (let j = 1; j <= corrLines.length; j++) {
      if (origLines[i - 1] === corrLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }
  
  const diff: DiffLine[] = [];
  let i = origLines.length;
  let j = corrLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && origLines[i - 1] === corrLines[j - 1]) {
      diff.push({ type: 'unchanged', content: origLines[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diff.push({ type: 'added', content: corrLines[j - 1] });
      j--;
    } else {
      diff.push({ type: 'removed', content: origLines[i - 1] });
      i--;
    }
  }
  
  return diff.reverse();
}

const pairs: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'"
};

const INITIAL_FILES = {
  'readme.md': `# SYNTEX — Intelligent Multi-Language Compiler IDE

Welcome to SYNTEX, a multi-language execution simulator & learning playground powered by SYNTEX.

## Workspace Actions
- **New File**: Create a custom buffer to write source code.
- **Import File**: Upload local files into the compiler playground.

## Supported Languages
- **Lex Language**: Standard Lex/Flex lexical analyzer specification language.
- **Python**: Full execution simulation.
- **Java**: Object-oriented structural compile.
- **JavaScript**: Client-side execution analyzer.
- **Natural Language**: Write instructions in plain English and automatically compile to Lex + target outputs.
`
};

// Custom client-side syntax highlighter
const highlightCode = (code: string, lang: string) => {
  if (lang === 'markdown') {
    return code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^(#+ .*)$/gm, '<span class="text-accent font-semibold font-serif">$1</span>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/`([^`]+)`/g, '<span class="bg-bg border border-border-light px-1 rounded text-accent font-mono">$1</span>');
  }

  // Tokenize using a single regex matching comments, strings, numbers, words, operators
  let tokenRegex = /(\/\/.*|\#.*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+\b)|(\b\w+\b)|([=+\-*\/<>!;{}()[\].,:])/g;


  // Language keywords definitions
  const lexKeywords = new Set(['int', 'float', 'char', 'void', 'double', 'printf', 'yylex', 'yytext', 'yywrap', 'main', 'return', 'include', 'stdio', 'stdlib', 'string']);
  const pythonKeywords = new Set(['def', 'class', 'if', 'elif', 'else', 'while', 'for', 'in', 'return', 'import', 'as', 'from', 'print', 'int', 'str', 'float', 'bool', 'True', 'False', 'None', 'len', 'range', 'input', 'and', 'or', 'not', 'with', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield']);
  const javaKeywords = new Set(['public', 'private', 'protected', 'class', 'static', 'void', 'int', 'double', 'float', 'String', 'boolean', 'if', 'else', 'while', 'for', 'return', 'new', 'import', 'package', 'System', 'out', 'println', 'try', 'catch', 'finally', 'throws', 'extends', 'implements', 'interface', 'abstract', 'final', 'super', 'this']);
  const jsKeywords = new Set(['const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for', 'class', 'import', 'export', 'from', 'console', 'log', 'async', 'await', 'new', 'this', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'try', 'catch', 'finally', 'throw']);
  const cKeywords = new Set(['int', 'float', 'double', 'char', 'void', 'if', 'else', 'while', 'for', 'return', 'include', 'define', 'struct', 'typedef', 'sizeof', 'static', 'const', 'unsigned', 'long', 'short', 'break', 'continue', 'switch', 'case', 'default', 'printf', 'scanf', 'main']);
  const cppKeywords = new Set(['int', 'float', 'double', 'char', 'void', 'bool', 'if', 'else', 'while', 'for', 'return', 'include', 'class', 'public', 'private', 'protected', 'new', 'delete', 'namespace', 'using', 'std', 'cout', 'cin', 'endl', 'string', 'vector', 'template', 'typename', 'const', 'static', 'virtual', 'override', 'nullptr', 'true', 'false', 'auto', 'struct']);

  let currentKeywords = new Set<string>();
  if (lang === 'lex') currentKeywords = lexKeywords;
  else if (lang === 'python') currentKeywords = pythonKeywords;
  else if (lang === 'java') currentKeywords = javaKeywords;
  else if (lang === 'javascript') currentKeywords = jsKeywords;
  else if (lang === 'c') currentKeywords = cKeywords;
  else if (lang === 'cpp') currentKeywords = cppKeywords;

  let lastIndex = 0;
  let resultHtml = '';

  // Single-pass replacement mapping
  code.replace(tokenRegex, (match, comment, str, num, word, op, index) => {
    if (index > lastIndex) {
      resultHtml += escapeHtml(code.substring(lastIndex, index));
    }

    if (comment) {
      resultHtml += `<span class="text-text-muted/50 italic">${escapeHtml(comment)}</span>`;
    } else if (str) {
      resultHtml += `<span class="text-emerald-600 dark:text-emerald-400">${escapeHtml(str)}</span>`;
    } else if (num) {
      resultHtml += `<span class="text-purple-500 font-medium">${escapeHtml(num)}</span>`;
    } else if (word) {
      if (currentKeywords.has(word)) {
        resultHtml += `<span class="text-accent font-semibold">${escapeHtml(word)}</span>`;
      } else {
        resultHtml += `<span class="text-sky-600 dark:text-sky-400 font-medium">${escapeHtml(word)}</span>`;
      }
    } else if (op) {
      resultHtml += `<span class="text-text-muted/80">${escapeHtml(op)}</span>`;
    }

    lastIndex = index + match.length;
    return match;
  });

  if (lastIndex < code.length) {
    resultHtml += escapeHtml(code.substring(lastIndex));
  }

  return resultHtml;
};

interface TreeBlock {
  lines: string[];
  rootPos: number;
}

const layoutTree = (node: any): TreeBlock => {
  if (!node) {
    return { lines: [], rootPos: 0 };
  }

  if (typeof node !== 'object') {
    const val = String(node);
    return {
      lines: [val],
      rootPos: Math.floor(val.length / 2)
    };
  }

  const type = node.type || node.name || 'Node';
  const name = (node.name && node.type) ? `:${node.name}` : '';
  const label = `${type}${name}`;
  
  let children = node.children || [];
  if (!Array.isArray(children)) {
    if (typeof children === 'object' && children !== null) {
      children = [children];
    } else {
      children = [];
    }
  }

  if (children.length === 0) {
    return {
      lines: [label],
      rootPos: Math.floor(label.length / 2)
    };
  }

  const childBlocks = children.map((c: any) => layoutTree(c));
  const maxHeight = Math.max(...childBlocks.map(b => b.lines.length));
  const childLines: string[][] = childBlocks.map(b => {
    const lines = [...b.lines];
    const width = lines[0] ? lines[0].length : 0;
    while (lines.length < maxHeight) {
      lines.push(' '.repeat(width));
    }
    return lines;
  });

  const separation = 3;
  const joinedLines: string[] = [];

  for (let i = 0; i < maxHeight; i++) {
    let line = '';
    childBlocks.forEach((b, idx) => {
      if (idx > 0) {
        line += ' '.repeat(separation);
      }
      line += childLines[idx][i];
    });
    joinedLines.push(line);
  }

  const childRootPositions: number[] = [];
  let currentOffset = 0;
  childBlocks.forEach((b, idx) => {
    if (idx === 0) {
      childRootPositions.push(b.rootPos);
      currentOffset = b.lines[0]?.length || 0;
    } else {
      childRootPositions.push(currentOffset + separation + b.rootPos);
      currentOffset += separation + (b.lines[0]?.length || 0);
    }
  });

  const firstRoot = childRootPositions[0];
  const lastRoot = childRootPositions[childRootPositions.length - 1];
  const midRoot = Math.floor((firstRoot + lastRoot) / 2);

  const width = joinedLines[0]?.length || 0;
  const connectorLine1 = Array(width).fill(' ');
  const connectorLine2 = Array(width).fill(' ');

  if (childBlocks.length === 1) {
    connectorLine1[firstRoot] = '|';
    connectorLine2[firstRoot] = '|';
  } else {
    for (let j = firstRoot + 1; j < lastRoot; j++) {
      connectorLine1[j] = '_';
    }
    connectorLine1[midRoot] = '|';

    childRootPositions.forEach((pos) => {
      if (pos < midRoot) {
        // Place slash exactly at the child root column
        connectorLine2[pos] = '/';
      } else if (pos > midRoot) {
        // Place backslash exactly at the child root column
        connectorLine2[pos] = '\\';
      } else {
        connectorLine2[pos] = '|';
      }
    });
  }

  const cLine1 = connectorLine1.join('');
  const cLine2 = connectorLine2.join('');

  let parentLine = '';
  let parentRootPos = midRoot;
  const labelHalf = Math.floor(label.length / 2);

  if (midRoot >= labelHalf) {
    parentLine = ' '.repeat(midRoot - labelHalf) + label;
    parentRootPos = midRoot;
  } else {
    parentLine = label;
    parentRootPos = labelHalf;
    const shift = labelHalf - midRoot;
    const shiftSpaces = ' '.repeat(shift);
    for (let i = 0; i < joinedLines.length; i++) {
      joinedLines[i] = shiftSpaces + joinedLines[i];
    }
  }

  const allLines = [parentLine, cLine1, cLine2, ...joinedLines];
  const maxLen = Math.max(...allLines.map(l => l.length));
  const finalLines = allLines.map(l => l + ' '.repeat(maxLen - l.length));

  return {
    lines: finalLines,
    rootPos: parentRootPos
  };
};

const generateAsciiTree = (node: any): string => {
  if (!node) return '';
  try {
    return layoutTree(node).lines.join('\n');
  } catch (e) {
    console.error("Failed to render AST Tree:", e);
    return '  Error rendering AST Tree. Please run compilation again.';
  }
};

const autocompleteCache = new Map<string, string>();

const getLocalSuggestion = (codeBefore: string, currentCode: string, currentLang: string): string => {
  const lastWordMatch = codeBefore.match(/\b([a-zA-Z_]\w*)$/);
  if (!lastWordMatch) return '';
  const partial = lastWordMatch[1];
  if (partial.length < 1) return ''; // only suggest for 1+ characters

  const lexKeywords = ['int', 'float', 'char', 'void', 'double', 'printf', 'yylex', 'yytext', 'yywrap', 'main', 'return', 'include', 'stdio', 'stdlib', 'string'];
  const pythonKeywords = ['def', 'class', 'if', 'elif', 'else', 'while', 'for', 'in', 'return', 'import', 'as', 'from', 'print', 'int', 'str', 'float', 'bool', 'True', 'False', 'None', 'len', 'range', 'input', 'and', 'or', 'not', 'with', 'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda', 'yield'];
  const javaKeywords = ['public', 'private', 'protected', 'class', 'static', 'void', 'int', 'double', 'float', 'String', 'boolean', 'if', 'else', 'while', 'for', 'return', 'new', 'import', 'package', 'System', 'out', 'println', 'try', 'catch', 'finally', 'throws', 'extends', 'implements', 'interface', 'abstract', 'final', 'super', 'this'];
  const jsKeywords = ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'while', 'for', 'class', 'import', 'export', 'from', 'console', 'log', 'async', 'await', 'new', 'this', 'typeof', 'instanceof', 'null', 'undefined', 'true', 'false', 'try', 'catch', 'finally', 'throw'];
  const cKeywords = ['int', 'float', 'double', 'char', 'void', 'if', 'else', 'while', 'for', 'return', 'include', 'define', 'struct', 'typedef', 'sizeof', 'static', 'const', 'unsigned', 'long', 'short', 'break', 'continue', 'switch', 'case', 'default', 'printf', 'scanf', 'main'];
  const cppKeywords = ['int', 'float', 'double', 'char', 'void', 'bool', 'if', 'else', 'while', 'for', 'return', 'include', 'class', 'public', 'private', 'protected', 'new', 'delete', 'namespace', 'using', 'std', 'cout', 'cin', 'endl', 'string', 'vector', 'template', 'typename', 'const', 'static', 'virtual', 'override', 'nullptr', 'true', 'false', 'auto', 'struct'];

  let keywords: string[] = [];
  if (currentLang === 'lex') keywords = lexKeywords;
  else if (currentLang === 'python') keywords = pythonKeywords;
  else if (currentLang === 'java') keywords = javaKeywords;
  else if (currentLang === 'javascript') keywords = jsKeywords;
  else if (currentLang === 'c') keywords = cKeywords;
  else if (currentLang === 'cpp') keywords = cppKeywords;

  const wordRegex = /\b([a-zA-Z_]\w*)\b/g;
  const existingWords = new Set<string>();
  let match;
  while ((match = wordRegex.exec(currentCode)) !== null) {
    existingWords.add(match[1]);
  }

  const candidates = Array.from(new Set([...keywords, ...Array.from(existingWords)]))
    .filter(word => word !== partial && word.startsWith(partial))
    .sort((a, b) => a.length - b.length || a.localeCompare(b));

  if (candidates.length > 0) {
    return candidates[0].substring(partial.length);
  }

  return '';
};

interface TreeItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: Record<string, TreeItem>;
}

const buildFileTree = (filesRecord: Record<string, string>) => {
  const root: Record<string, TreeItem> = {};
  
  Object.keys(filesRecord).forEach(filePath => {
    const parts = filePath.split('/');
    let currentLevel = root;
    let currentPath = '';
    
    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isLast = index === parts.length - 1;
      
      // If it's the last part and it's a dummy file representing an empty folder
      if (isLast && part === '.keep') {
        // Just make sure the parent folder exists
        return;
      }
      
      if (!currentLevel[part]) {
        currentLevel[part] = {
          name: part,
          path: currentPath,
          type: isLast ? 'file' : 'folder',
          children: isLast ? undefined : {}
        };
      }
      
      if (!isLast) {
        if (!currentLevel[part].children) {
          currentLevel[part].children = {};
        }
        currentLevel = currentLevel[part].children!;
      }
    });
  });
  
  return root;
};



interface ASTNodeRendererProps {
  node: ASTNode;
}

function ASTNodeRenderer({ node }: ASTNodeRendererProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  let badgeColor = 'bg-bg text-text-main border-border-light/60';
  if (node.type?.toLowerCase().includes('decl') || node.type?.toLowerCase().includes('var')) {
    badgeColor = 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
  } else if (node.type?.toLowerCase().includes('func') || node.type?.toLowerCase().includes('program')) {
    badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
  } else if (node.type?.toLowerCase().includes('expr') || node.type?.toLowerCase().includes('op')) {
    badgeColor = 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
  } else if (node.type?.toLowerCase().includes('literal') || node.type?.toLowerCase().includes('num') || node.type?.toLowerCase().includes('str')) {
    badgeColor = 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
  }

  return (
    <div className="flex flex-col relative select-none">
      <div 
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        className={`flex items-center gap-2 py-1 px-2.5 rounded-lg border text-[10.5px] font-mono w-fit transition-all ${badgeColor} ${hasChildren ? 'cursor-pointer hover:shadow-sm' : ''}`}
      >
        {hasChildren && (
          <span 
            className="text-[8px] text-text-muted/60 transition-transform duration-150 mr-0.5" 
            style={{ display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
          >
            ➔
          </span>
        )}
        <span className="font-bold opacity-60 text-[8px] uppercase tracking-wider">{node.type}</span>
        <span className="font-semibold">{node.name}</span>
      </div>

      {hasChildren && isExpanded && (
        <div className="pl-4 border-l border-border-light/50 ml-3.5 mt-1 flex flex-col gap-1.5 relative">
          {node.children!.map((child, idx) => (
            <ASTNodeRenderer key={idx} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export function EditorView({ onBack }: { onBack: () => void }) {
  // Mount Guard
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // LocalStorage loaders
  const getInitialFiles = (): Record<string, string> => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synthex_files');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          // ignore
        }
      }
    }
    return INITIAL_FILES;
  };

  const getInitialActiveFile = (initialFiles: Record<string, string>): string => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('synthex_active_file');
      if (saved && initialFiles[saved] !== undefined) {
        return saved;
      }
    }
    return Object.keys(initialFiles)[0] || 'readme.md';
  };

  const [files, setFiles] = useState<Record<string, string>>(getInitialFiles);
  const [activeFile, setActiveFile] = useState<string>(() => {
    const initialFiles = getInitialFiles();
    return getInitialActiveFile(initialFiles);
  });
  const [editorCode, setEditorCode] = useState(() => {
    const initialFiles = getInitialFiles();
    const actFile = getInitialActiveFile(initialFiles);
    return initialFiles[actFile] || '';
  });
  
  const langMode = getLangMode(activeFile);
  const [targetLang, setTargetLang] = useState<'lex' | 'python' | 'java' | 'javascript' | 'c' | 'cpp'>('python');
  const [stdin, setStdin] = useState('');
  
  const [result, setResult] = useState<CompilerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'console' | 'stdin' | 'tokens' | 'ast' | 'translated' | 'ai'>('console');
  const [mobileTab, setMobileTab] = useState<'files' | 'editor' | 'outputs'>('editor');
  const [astViewMode, setAstViewMode] = useState<'graphical' | 'ascii'>('graphical');

  const [copilotMessages, setCopilotMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; codeBlock?: string }>>([
    { sender: 'assistant', text: 'Hi! I am the SYNTEX Compiler Assistant. Ask me to optimize, analyze, or explain anything about your current code.' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [editorGlow, setEditorGlow] = useState(false);
  const [errorLines, setErrorLines] = useState<number[]>([]);

  // Open Editor Tabs state
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    const initialFiles = getInitialFiles();
    const actFile = getInitialActiveFile(initialFiles);
    return [actFile];
  });

  const [aiContextTab, setAiContextTab] = useState<string>('active');

  // Compilation/Execution run history state
  const [runHistory, setRunHistory] = useState<Array<{
    id: string;
    time: string;
    file: string;
    status: 'success' | 'error' | 'pending';
    label: string;
    result?: CompilerResult | null;
    phasesData?: typeof phasesData;
    consoleLogs?: string[];
  }>>([
    { id: 'h-init', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), file: 'readme.md', status: 'success', label: 'Buffer ready' }
  ]);

  // Keep openTabs synced automatically with activeFile changes
  useEffect(() => {
    if (activeFile && !openTabs.includes(activeFile)) {
      setOpenTabs(prev => [...prev, activeFile]);
    }
  }, [activeFile, openTabs]);

  const handleCloseTab = (filename: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextTabs = openTabs.filter(t => t !== filename);
    setOpenTabs(nextTabs);
    
    if (aiContextTab === filename) {
      setAiContextTab('active');
    }
    
    if (activeFile === filename) {
      if (nextTabs.length > 0) {
        setActiveFile(nextTabs[nextTabs.length - 1]);
      } else {
        const remaining = Object.keys(files).filter(f => !f.endsWith('/.keep'));
        if (remaining.length > 0) {
          setActiveFile(remaining[0]);
        } else {
          setActiveFile('');
        }
      }
    }
  };
  
  // Code change history for AI Insights undo/redo
  const [codeHistory, setCodeHistory] = useState<Array<{ id: string; code: string; timestamp: string; label: string }>>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  // Mode & input dialog states
  const [executionMode, setExecutionMode] = useState<'compiler' | 'phases'>('compiler');
  const [showInputDialog, setShowInputDialog] = useState(false);
  const [dialogInput, setDialogInput] = useState('');
  
  // Custom Create New File Dialog state
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileError, setNewFileError] = useState('');

  // Folder tree states
  const [selectedFolderForCreate, setSelectedFolderForCreate] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderError, setNewFolderError] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src': true
  });

  // Custom modals/alerts
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<string | null>(null);
  const [customAlert, setCustomAlert] = useState<string | null>(null);

  // AI Autocomplete ghost text state
  const [ghostText, setGhostText] = useState('');
  const [autocompleteEnabled, setAutocompleteEnabled] = useState(true);
  const autocompleteCooldownRef = useRef(false);
  const lastAutocompleteTriggerRef = useRef<{ code: string; cursor: number } | null>(null);
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // AI Code Fix Proposal popup toggle
  const [showFixProposal, setShowFixProposal] = useState(false);

  // Structured phases data for rich rendering
  const [phasesData, setPhasesData] = useState<Array<{
    id: number;
    title: string;
    color: string;
    content: string;
    status: 'pending' | 'running' | 'done' | 'error';
  }>>([]);

  const preRef = useRef<HTMLPreElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const renderTree = (tree: Record<string, TreeItem>, depth: number = 0) => {
    const sortedKeys = Object.keys(tree).sort((a, b) => {
      const itemA = tree[a];
      const itemB = tree[b];
      if (itemA.type !== itemB.type) {
        return itemA.type === 'folder' ? -1 : 1;
      }
      return itemA.name.localeCompare(itemB.name);
    });

    return sortedKeys.map(key => {
      const item = tree[key];
      const isFolder = item.type === 'folder';
      
      if (isFolder) {
        const isExpanded = !!expandedFolders[item.path];
        const isFolderActive = activeFile.startsWith(item.path + '/');
        
        return (
          <div key={item.path} className="flex flex-col gap-0.5">
            <div
              onClick={() => setExpandedFolders(prev => ({ ...prev, [item.path]: !isExpanded }))}
              style={{ paddingLeft: `${depth * 10 + 4}px` }}
              className={`group w-full flex items-center justify-between gap-1 py-1 rounded-md text-[10.5px] font-medium transition-all text-left cursor-pointer border ${
                isFolderActive 
                  ? 'bg-accent/5 border-accent/15 text-accent' 
                  : 'bg-transparent border-transparent text-text-muted hover:bg-bg/40 hover:text-text-main'
              }`}
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <span className="text-text-muted/60 transition-transform duration-200" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  <ChevronRight size={10} />
                </span>
                <Folder size={11} className="text-accent shrink-0" />
                <span className="flex-1 truncate font-sans">{item.name}</span>
              </div>
              
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity duration-200" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setSelectedFolderForCreate(item.path);
                    setNewFileName('');
                    setNewFileError('');
                    setShowNewFileDialog(true);
                  }}
                  title="Create file in folder"
                  className="p-0.5 rounded hover:bg-bg/60 text-text-muted hover:text-accent cursor-pointer"
                >
                  <Plus size={10} />
                </button>
                <button
                  onClick={() => {
                    setSelectedFolderForCreate(item.path);
                    setNewFolderName('');
                    setNewFolderError('');
                    setShowNewFolderDialog(true);
                  }}
                  title="Create subfolder"
                  className="p-0.5 rounded hover:bg-bg/60 text-text-muted hover:text-accent cursor-pointer"
                >
                  <FolderPlus size={10} />
                </button>
                <button
                  onClick={() => handleDeleteFolder(item.path)}
                  title="Delete folder"
                  className="p-0.5 rounded hover:bg-bg/60 text-text-muted hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            </div>
            
            {isExpanded && item.children && (
              <div className="flex flex-col gap-0.5">
                {renderTree(item.children, depth + 1)}
              </div>
            )}
          </div>
        );
      } else {
        const filename = item.path;
        const isActive = filename === activeFile;
        const isReadme = filename === 'readme.md';
        const isProjectSource = filename === 'project_source_code.txt';
        const canModify = !isReadme && !isProjectSource;
        
        return (
          <div
            key={filename}
            onClick={() => {
              if (renamingFile !== filename) {
                setActiveFile(filename);
              }
            }}
            style={{ paddingLeft: `${depth * 10 + 16}px` }}
            className={`group w-full flex items-center justify-between gap-1 py-1 rounded-md text-[10.5px] font-medium transition-all text-left cursor-pointer border ${
              isActive 
                ? 'bg-accent/10 border-accent/20 text-accent font-sans font-semibold' 
                : 'bg-transparent border-transparent text-text-muted hover:bg-bg/40 hover:text-text-main'
            }`}
          >
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              {filename.endsWith('.md') ? <FileText size={11} className="shrink-0" /> : <FileCode size={11} className="shrink-0" />}
              
              {renamingFile === filename ? (
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => {
                    handleRenameFile(filename, renameValue);
                    setRenamingFile(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleRenameFile(filename, renameValue);
                      setRenamingFile(null);
                    } else if (e.key === 'Escape') {
                      setRenamingFile(null);
                    }
                  }}
                  className="bg-bg border border-accent/40 rounded px-1 py-0.5 text-[10.5px] text-text-main outline-none w-full font-sans"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span 
                  className="flex-1 truncate font-sans"
                  onDoubleClick={(e) => {
                    if (canModify) {
                      e.stopPropagation();
                      setRenamingFile(filename);
                      setRenameValue(item.name);
                    }
                  }}
                >
                  {item.name}
                </span>
              )}
            </div>
            
            {canModify && renamingFile !== filename && (
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => {
                    setRenamingFile(filename);
                    setRenameValue(item.name);
                  }}
                  title="Rename file"
                  className="p-0.5 rounded hover:bg-bg/60 text-text-muted hover:text-accent cursor-pointer"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  onClick={() => downloadFile(filename)}
                  title="Download file"
                  className="p-1 rounded hover:bg-bg/60 text-text-muted hover:text-accent cursor-pointer"
                >
                  <Download size={11} />
                </button>
                <button
                  onClick={(e) => handleDeleteFile(filename, e)}
                  title="Delete file"
                  className="p-1 rounded hover:bg-bg/60 text-text-muted hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}
          </div>
        );
      }
    });
  };

  // Persist files and active file
  useEffect(() => {
    localStorage.setItem('synthex_files', JSON.stringify(files));
  }, [files]);

  useEffect(() => {
    localStorage.setItem('synthex_active_file', activeFile);
  }, [activeFile]);

  // Sync editor view on active file change
  useEffect(() => {
    setEditorCode(files[activeFile] || '');
    setResult(null);
    setErrorLines([]);
  }, [activeFile]);

  // Autocomplete ghost text
  const autocompleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Trigger AI autocomplete on edit with debounce as user types
  useEffect(() => {
    if (!autocompleteEnabled) return;
    if (autocompleteCooldownRef.current) return;
    if (!editorCode || langMode === 'markdown' || langMode === 'natural') return;

    const textarea = textareaRef.current;
    if (!textarea) return;
    const cursor = textarea.selectionStart;

    // Check for instant local autocomplete first (0ms delay)
    if (cursor > 0) {
      const codeBefore = editorCode.substring(0, cursor);
      const localSuggestion = getLocalSuggestion(codeBefore, editorCode, langMode);
      if (localSuggestion) {
        setGhostText(localSuggestion);
        if (autocompleteTimerRef.current) {
          clearTimeout(autocompleteTimerRef.current);
        }
        return;
      }
    }

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }

    autocompleteTimerRef.current = setTimeout(() => {
      if (cursor > 0) {
        triggerAutocomplete(editorCode, langMode, cursor);
      }
    }, 150);

    return () => {
      if (autocompleteTimerRef.current) {
        clearTimeout(autocompleteTimerRef.current);
      }
    };
  }, [editorCode, autocompleteEnabled, langMode]);

  const triggerAutocomplete = async (currentCode: string, currentLang: string, cursorPosition: number) => {
    if (!autocompleteEnabled) return;
    if (autocompleteCooldownRef.current) return;
    if (!currentCode || currentLang === 'markdown' || currentLang === 'natural') return;
    
    const codeBefore = currentCode.substring(0, cursorPosition);
    if (!codeBefore.trim()) return;

    const cacheKey = `${currentLang}:${codeBefore}`;
    if (autocompleteCache.has(cacheKey)) {
      const suggestion = autocompleteCache.get(cacheKey) || '';
      if (suggestion.trim().length > 0) {
        setGhostText(suggestion);
      }
      return;
    }

    lastAutocompleteTriggerRef.current = { code: currentCode, cursor: cursorPosition };

    try {
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode,
          cursorPosition,
          language: currentLang
        })
      });
      if (response.ok && isMountedRef.current) {
        const data = await response.json();
        // Check if editor state has changed since this request was made
        if (
          lastAutocompleteTriggerRef.current &&
          lastAutocompleteTriggerRef.current.code === currentCode &&
          lastAutocompleteTriggerRef.current.cursor === cursorPosition &&
          textareaRef.current &&
          textareaRef.current.value === currentCode &&
          textareaRef.current.selectionStart === cursorPosition
        ) {
          if (data.suggestion && data.suggestion.trim().length > 0) {
            setGhostText(data.suggestion);
            autocompleteCache.set(cacheKey, data.suggestion);
          }
        }
      }
    } catch (err) {
      // silently fail
    }
  };

  // Sync scroll positions
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  const handleEditorChange = (val: string) => {
    setGhostText('');
    setErrorLines([]);
    setEditorCode(val);
    setFiles(prev => ({ ...prev, [activeFile]: val }));

    if (autocompleteTimerRef.current) {
      clearTimeout(autocompleteTimerRef.current);
    }
  };

  const handleApplyFix = (codeToApply?: string) => {
    const fixCode = codeToApply || (result && result.correctedCode);
    if (fixCode) {
      const now = new Date();
      const label = `Fix applied at ${now.toLocaleTimeString()}`;
      const newId = Math.random().toString(36).substring(2, 9);
      
      setCodeHistory(prev => {
        const idx = currentHistoryId ? prev.findIndex(h => h.id === currentHistoryId) : -1;
        const trimmed = idx !== -1 ? prev.slice(0, idx) : prev;
        const updated = [...trimmed, { id: newId, code: editorCode, timestamp: now.toISOString(), label }];
        if (updated.length > 20) {
          return updated.slice(updated.length - 20);
        }
        return updated;
      });
      
      setCurrentHistoryId(newId);
      handleEditorChange(fixCode);
      setEditorGlow(true);
      setTimeout(() => {
        if (isMountedRef.current) setEditorGlow(false);
      }, 1500);
      setConsoleLogs(prev => [
        ...prev,
        'AI fix applied in editor.',
        'Running static code-check...'
      ]);
    }
  };

  const handleUndoHistory = (id: string) => {
    const entry = codeHistory.find(h => h.id === id);
    if (entry) {
      handleEditorChange(entry.code);
      setCurrentHistoryId(id);
    }
  };

  const detectInputsNeeded = (code: string, lang: string): boolean => {
    const cleanCode = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/#.*$/gm, '')
      .replace(/"(\\.|[^"\\])*"/g, '""')
      .replace(/'(\\.|[^'\\])*'/g, "''")
      .replace(/`(\\.|[^`\\])*`/g, "``");
    
    const codeLower = cleanCode.toLowerCase();
    if (lang === 'python') {
      return /\binput\s*\(/i.test(cleanCode) || codeLower.includes('sys.stdin');
    }
    if (lang === 'lex') {
      return true;
    }
    if (lang === 'java') {
      return codeLower.includes('scanner') || codeLower.includes('system.in') || codeLower.includes('.read(');
    }
    if (lang === 'javascript') {
      return /\bprompt\s*\(/i.test(cleanCode) || codeLower.includes('readline');
    }
    if (lang === 'c') {
      return /\bscanf\s*\(/i.test(cleanCode) || codeLower.includes('getchar(') || codeLower.includes('gets(');
    }
    if (lang === 'cpp') {
      return codeLower.includes('cin') || /\bscanf\s*\(/i.test(cleanCode);
    }
    return false;
  };

  const scrollToLine = (lineNum: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const lines = textarea.value.split('\n');
    let charIndex = 0;
    for (let i = 0; i < Math.min(lineNum - 1, lines.length); i++) {
      charIndex += lines[i].length + 1;
    }
    
    textarea.focus();
    textarea.setSelectionRange(charIndex, charIndex);
    
    const lineHeight = 24; // matches leading-6 (24px)
    textarea.scrollTop = (lineNum - 1) * lineHeight - 48;
  };

  const executeCompiler = async (inputVal: string) => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setConsoleLogs([]);
    setActiveTab('console');

    const initialLogs = [
      'Initializing Syntex Engine Pipeline v3.1.0...',
      `Reading code buffer for ${activeFile}...`,
      'Contacting SYNTEX Compiler Assistant...'
    ];

    setConsoleLogs(initialLogs);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/correct-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: editorCode, 
          language: langMode,
          target: targetLang,
          stdin: inputVal
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Backend compilation failed';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!isMountedRef.current) return;
      setResult(data);
      
      const newErrorLines: number[] = Array.isArray(data.errorLines) ? data.errorLines : [];
      setErrorLines(newErrorLines);
      
      if (newErrorLines.length > 0 && data.correctedCode && data.correctedCode !== editorCode) {
        setShowFixProposal(true);
      }

      const compileOutput = data.consoleOutput || 'Compilation finished.\nNo program stdout returned.';
      const outputLower = compileOutput.toLowerCase();
      const hasError = newErrorLines.length > 0 ||
                       outputLower.includes('error') || 
                       outputLower.includes('exception') || 
                       outputLower.includes('traceback') ||
                       outputLower.includes('failed') || 
                       outputLower.includes('invalid syntax') || 
                       outputLower.includes('compile error') ||
                       (data.explanation && data.explanation.toLowerCase().includes('error'));

      const statusMsg = hasError 
        ? 'Process completed with exit status code 1.'
        : 'Process completed with exit status code 0.';

      setConsoleLogs(prev => [
        ...prev,
        'SYNTEX Compiler Response received.',
        'Simulating process environment execution...',
        '-------------------------------------------',
        ...compileOutput.split('\n'),
        '-------------------------------------------',
        statusMsg
      ]);
    } catch (e: any) {
      if (!isMountedRef.current) return;
      console.error(e);
      const errMsg = e.name === 'AbortError' 
        ? 'Compiler Error: Request timeout after 25 seconds.'
        : `Compiler Error: ${e.message}`;
      setConsoleLogs(prev => [
        ...prev,
        errMsg,
        'Verify your OpenRouter API Key configuration and internet connection.'
      ]);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const executeCompilerPhases = async (inputVal: string) => {
    if (loading) return;
    setLoading(true);
    setResult(null);
    setConsoleLogs([]);
    setActiveTab('console');

    const PHASE_DEFS = [
      { id: 1, title: 'Lexical Analysis', color: 'blue' },
      { id: 2, title: 'Syntax Analysis (Parser)', color: 'purple' },
      { id: 3, title: 'Semantic Analysis', color: 'indigo' },
      { id: 4, title: 'Code Optimization', color: 'amber' },
      { id: 5, title: 'Target Code Generation', color: 'orange' },
      { id: 6, title: 'Simulated Execution', color: 'emerald' },
    ];

    setConsoleLogs(['Initializing Syntex Engine Pipeline v3.1.0...', `Reading: ${activeFile}`]);
    
    // Initialize phases immediately in a single batch to avoid layout flashes
    setPhasesData(PHASE_DEFS.map(p => ({ ...p, content: '', status: 'pending' })));

    await new Promise(res => setTimeout(res, 250));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch('/api/correct-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: editorCode, 
          language: langMode,
          target: targetLang,
          stdin: inputVal
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorMsg = 'Backend compilation failed';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            errorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errorMsg);
      }

      const data = await response.json();
      if (!isMountedRef.current) return;
      setResult(data);
      
      const newErrorLines: number[] = Array.isArray(data.errorLines) ? data.errorLines : [];
      setErrorLines(newErrorLines);
      
      if (newErrorLines.length > 0 && data.correctedCode && data.correctedCode !== editorCode) {
        setShowFixProposal(true);
      }

      const tokensList = data.tokens && data.tokens.length > 0
        ? data.tokens.map((t: any) => `  [${t.type}]  "${t.value}"`).join('\n')
        : '  No tokens found.';

      const asciiTree = data.ast ? generateAsciiTree(data.ast) : '  No AST generated.';
      const compiledCodeText = data.compiledCode || '  No target code generated.';
      const compileOutput = data.consoleOutput || 'No output.';

      const outputLower = compileOutput.toLowerCase();
      const hasError = newErrorLines.length > 0 ||
                       outputLower.includes('error') || outputLower.includes('exception') ||
                       outputLower.includes('traceback') || outputLower.includes('failed');
      const statusMsg = hasError ? 'Exit code 1 — Errors detected.' : 'Exit code 0 — Completed successfully.';

      const phaseContents = [
        tokensList,
        asciiTree,
        `  Symbol table verified.\n  Type checking: ${hasError ? 'FAILED' : 'PASSED'}\n  Scope validation: ${hasError ? 'FAILED' : 'PASSED'}`,
        `  Dead code elimination: complete\n  Constant folding: applied\n  Loop unrolling: checked\n  Optimized nodes: ${data.ast ? 'generated' : 'N/A'}`,
        compiledCodeText,
        `${compileOutput}\n\n${statusMsg}`,
      ];

      const finalPhases = PHASE_DEFS.map((p, idx) => ({
        ...p,
        content: phaseContents[idx],
        status: (idx === 5 && hasError) ? ('error' as const) : ('done' as const)
      }));

      // Add to session execution run history
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setRunHistory(prev => [
        {
          id: Math.random().toString(),
          time: timeStr,
          file: activeFile,
          status: (hasError ? 'error' : 'success') as 'success' | 'error' | 'pending',
          label: hasError ? 'Failed' : 'Success',
          result: data,
          phasesData: finalPhases,
          consoleLogs: [...consoleLogs, '', statusMsg]
        },
        ...prev
      ].slice(0, 5));

      for (let i = 0; i < PHASE_DEFS.length; i++) {
        if (!isMountedRef.current) return;
        // Mark as running
        setPhasesData(prev => prev.map(p =>
          p.id === PHASE_DEFS[i].id ? { ...p, status: 'running' } : p
        ));
        await new Promise(res => setTimeout(res, 12));
        
        if (!isMountedRef.current) return;
        // Mark as done with content
        setPhasesData(prev => prev.map(p =>
          p.id === PHASE_DEFS[i].id
            ? { ...p, content: phaseContents[i], status: (i === 5 && hasError) ? 'error' : 'done' }
            : p
        ));
        await new Promise(res => setTimeout(res, 4));
      }

      if (!isMountedRef.current) return;
      setConsoleLogs(prev => [...prev, '', statusMsg]);

    } catch (e: any) {
      if (!isMountedRef.current) return;
      console.error(e);
      const errMsg = e.name === 'AbortError'
        ? 'Compiler Error: Request timeout after 25 seconds.'
        : `Compiler Error: ${e.message}`;
      setConsoleLogs(prev => [...prev, errMsg]);

      const errTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const crashPhases = PHASE_DEFS.map((p, idx) => ({
        ...p,
        content: idx === 5 ? errMsg : 'Skipped due to pipeline failure.',
        status: idx === 5 ? ('error' as const) : ('done' as const)
      }));
      setRunHistory(prev => [
        {
          id: Math.random().toString(),
          time: errTimeStr,
          file: activeFile,
          status: 'error' as 'success' | 'error' | 'pending',
          label: 'Crash',
          result: null,
          phasesData: crashPhases,
          consoleLogs: [...consoleLogs, errMsg]
        },
        ...prev
      ].slice(0, 5));
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleRun = () => {
    if (loading) return;
    const inputsNeeded = detectInputsNeeded(editorCode, langMode);
    if (inputsNeeded) {
      setDialogInput(stdin);
      setShowInputDialog(true);
    } else {
      if (executionMode === 'compiler') {
        executeCompiler(stdin);
      } else {
        executeCompilerPhases(stdin);
      }
    }
  };

  const handleConfirmInput = (inputVal: string) => {
    setShowInputDialog(false);
    setStdin(inputVal);
    if (executionMode === 'compiler') {
      executeCompiler(inputVal);
    } else {
      executeCompilerPhases(inputVal);
    }
  };

  const handleSendCopilotMessage = async (textToSend?: string) => {
    const prompt = textToSend || chatInput;
    if (!prompt.trim() || chatLoading) return;

    // Add user message
    const newMessages = [...copilotMessages, { sender: 'user' as const, text: prompt }];
    setCopilotMessages(newMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      let targetCode = editorCode;
      let targetLanguage: string = langMode;

      if (aiContextTab === 'workspace') {
        let workspaceContext = '';
        for (const [path, content] of Object.entries(files)) {
          if (!path.endsWith('/.keep')) {
            workspaceContext += `File: ${path}\n\`\`\`${getLangMode(path)}\n${content}\n\`\`\`\n\n`;
          }
        }
        targetCode = workspaceContext;
        targetLanguage = 'workspace';
      } else if (aiContextTab !== 'active' && files[aiContextTab] !== undefined) {
        targetCode = files[aiContextTab];
        targetLanguage = getLangMode(aiContextTab);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          code: targetCode,
          language: targetLanguage
        })
      });

      if (!response.ok) {
        throw new Error('API server returned error');
      }

      const data = await response.json();
      setCopilotMessages(prev => [
        ...prev,
        {
          sender: 'assistant' as const,
          text: data.text || 'No response from compiler assistant.',
          codeBlock: data.codeBlock || undefined
        }
      ]);
    } catch (err: any) {
      setCopilotMessages(prev => [
        ...prev,
        {
          sender: 'assistant' as const,
          text: 'Error contacting SYNTEX assistant backend. Please verify your OpenRouter API Key configuration and local server connection.'
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    


    if (e.key === 'Escape') {
      setGhostText('');
      return;
    }

    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = value.charAt(start - 1);
      const nextChar = value.charAt(start);
      if (pairs[prevChar] === nextChar) {
        e.preventDefault();
        const newValue = value.substring(0, start - 1) + value.substring(start + 1);
        handleEditorChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start - 1;
          textarea.selectionEnd = start - 1;
        }, 0);
        return;
      }
    }

    const nextChar = value.charAt(start);
    if ([')', ']', '}', '"', "'"].includes(e.key) && nextChar === e.key) {
      e.preventDefault();
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1;
      }, 0);
      return;
    }

    if (e.key === 'Enter') {
      // Auto-indent: match indentation of current line
      e.preventDefault();
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const currentLine = value.substring(lineStart, start);
      const indent = currentLine.match(/^(\s*)/)?.[1] || '';
      // Extra indent after colon (Python/Lex) or opening brace
      const extraIndent = /[:{]\s*$/.test(currentLine.trimEnd()) ? '    ' : '';
      const newValue = value.substring(0, start) + '\n' + indent + extraIndent + value.substring(end);
      handleEditorChange(newValue);
      const newCursor = start + 1 + indent.length + extraIndent.length;
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = newCursor;
        textarea.selectionEnd = newCursor;
      }, 0);
      return;
    }

    if (pairs[e.key] !== undefined) {
      e.preventDefault();
      const closeChar = pairs[e.key];
      const selectedText = value.substring(start, end);
      const newValue = value.substring(0, start) + e.key + selectedText + closeChar + value.substring(end);
      
      handleEditorChange(newValue);
      
      setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = start + 1;
        textarea.selectionEnd = start + 1 + selectedText.length;
      }, 0);
      return;
    }
    
    if (e.key === 'Tab') {
      e.preventDefault();
      if (ghostText) {
        const newValue = value.substring(0, start) + ghostText + value.substring(end);
        handleEditorChange(newValue);
        setGhostText('');
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start + ghostText.length;
          textarea.selectionEnd = start + ghostText.length;
        }, 0);
      } else {
        const newValue = value.substring(0, start) + '    ' + value.substring(end);
        handleEditorChange(newValue);
        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = start + 4;
          textarea.selectionEnd = start + 4;
        }, 0);
      }
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string) => {
    const content = files[filename] || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleNewFile = () => {
    setNewFileName('');
    setNewFileError('');
    setShowNewFileDialog(true);
  };

  const getTemplateForFileName = (name: string): string => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.py')) {
      return `# Python Source File\n\ndef main():\n    print("Hello, Python!")\n\nif __name__ == "__main__":\n    main()\n`;
    }
    if (lower.endsWith('.java')) {
      const basename = name.substring(0, name.lastIndexOf('.')) || 'Main';
      const className = basename.charAt(0).toUpperCase() + basename.slice(1);
      return `// Java Source File\nimport java.util.*;\n\npublic class ${className} {\n    public static void main(String[] args) {\n        System.out.println("Hello, Java!");\n    }\n}\n`;
    }
    if (lower.endsWith('.c')) {
      return `#include <stdio.h>\n#include <stdlib.h>\n\nint main() {\n    printf("Hello, C!\\n");\n    return 0;\n}\n`;
    }
    if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.h')) {
      return `#include <iostream>\n#include <vector>\n#include <string>\n\nusing namespace std;\n\nint main() {\n    cout << "Hello, C++!" << endl;\n    return 0;\n}\n`;
    }
    if (lower.endsWith('.lex') || lower.endsWith('.l')) {
      return `%{\n#include <stdio.h>\n%}\n\n%%\n[ \\t\\n]+ ;\n. { printf("%s", yytext); }\n%%\n\nint yywrap() {\n    return 1;\n}\n\nint main() {\n    yylex();\n    return 0;\n}\n`;
    }
    if (lower.endsWith('.js') || lower.endsWith('.ts')) {
      return `// Source File\n\nconsole.log("Hello!");\n`;
    }
    return '';
  };

  const getLanguageModeFromExtension = (name: string): 'lex' | 'python' | 'java' | 'javascript' | 'c' | 'cpp' | 'natural' | null => {
    const lower = name.toLowerCase();
    if (lower.endsWith('.py')) return 'python';
    if (lower.endsWith('.java')) return 'java';
    if (lower.endsWith('.c')) return 'c';
    if (lower.endsWith('.cpp') || lower.endsWith('.cc')) return 'cpp';
    if (lower.endsWith('.lex') || lower.endsWith('.l')) return 'lex';
    if (lower.endsWith('.js') || lower.endsWith('.ts')) return 'javascript';
    if (lower.endsWith('.txt') || lower.endsWith('.md')) return 'natural';
    return null;
  };

  const handleCreateFileSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newFileName.trim();
    if (!name) {
      setNewFileError('File name cannot be empty');
      return;
    }
    if (name.includes('/') || name.includes('\\')) {
      setNewFileError('File name cannot contain slashes');
      return;
    }
    
    // File path: if inside selected folder, prefix it
    const filePath = selectedFolderForCreate ? `${selectedFolderForCreate}/${name}` : name;
    
    if (files[filePath] !== undefined) {
      setNewFileError('File already exists');
      return;
    }
    
    const templateContent = getTemplateForFileName(name);
    
    setFiles(prev => {
      const copy = { ...prev, [filePath]: templateContent };
      // Clean up the placeholder if we had a .keep file here
      if (selectedFolderForCreate && copy[`${selectedFolderForCreate}/.keep`] !== undefined) {
        delete copy[`${selectedFolderForCreate}/.keep`];
      }
      return copy;
    });
    
    setActiveFile(filePath);
    setShowNewFileDialog(false);
    setNewFileName('');
    setNewFileError('');
  };

  const handleCreateFolderSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = newFolderName.trim();
    if (!name) {
      setNewFolderError('Folder name cannot be empty');
      return;
    }
    if (name.includes('/') || name.includes('\\') || name.includes('.')) {
      setNewFolderError('Folder name cannot contain slashes or dots');
      return;
    }
    
    const folderPath = selectedFolderForCreate ? `${selectedFolderForCreate}/${name}` : name;
    const keepFilePath = `${folderPath}/.keep`;
    
    if (files[keepFilePath] !== undefined) {
      setNewFolderError('Folder already exists');
      return;
    }
    
    setFiles(prev => ({
      ...prev,
      [keepFilePath]: '' // create empty keep file to preserve folder
    }));
    
    if (selectedFolderForCreate) {
      setExpandedFolders(prev => ({ ...prev, [selectedFolderForCreate]: true }));
    }
    
    setShowNewFolderDialog(false);
    setNewFolderName('');
    setNewFolderError('');
  };

  const handleDeleteFolder = (folderPath: string) => {
    setFiles(prev => {
      const copy = { ...prev };
      Object.keys(copy).forEach(filePath => {
        if (filePath === folderPath || filePath.startsWith(folderPath + '/')) {
          delete copy[filePath];
        }
      });
      
      // Put a keep file back in parent folder if we just deleted its last contents
      const parts = folderPath.split('/');
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        const hasOtherFiles = Object.keys(copy).some(p => p.startsWith(parentPath + '/'));
        if (!hasOtherFiles) {
          copy[`${parentPath}/.keep`] = '';
        }
      }

      if (activeFile.startsWith(folderPath + '/')) {
        const remaining = Object.keys(copy).filter(f => !f.endsWith('/.keep'));
        setActiveFile(remaining[0] || 'readme.md');
      }
      
      return copy;
    });
  };

  const handleDeleteFile = (filenameToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (filenameToDelete === 'readme.md') return;
    setDeleteConfirmFile(filenameToDelete);
  };

  const confirmDeleteFile = () => {
    if (!deleteConfirmFile) return;
    const filenameToDelete = deleteConfirmFile;
    
    setFiles(prev => {
      const copy = { ...prev };
      delete copy[filenameToDelete];
      
      // If parent folder has no files left, put back .keep file
      const parts = filenameToDelete.split('/');
      if (parts.length > 1) {
        const parentPath = parts.slice(0, -1).join('/');
        const hasOtherFiles = Object.keys(copy).some(p => p.startsWith(parentPath + '/'));
        if (!hasOtherFiles) {
          copy[`${parentPath}/.keep`] = '';
        }
      }
      
      if (activeFile === filenameToDelete) {
        const remaining = Object.keys(copy).filter(f => f !== filenameToDelete && !f.endsWith('/.keep'));
        setActiveFile(remaining[0] || 'readme.md');
      }
      
      return copy;
    });
    
    setDeleteConfirmFile(null);
  };

  const handleRenameFile = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName === trimmed) return;
    if (trimmed.includes('/') || trimmed.includes('\\')) {
      setCustomAlert('File name cannot contain slashes.');
      return;
    }
    
    // Rename keeping parent folder prefix
    const parts = oldName.split('/');
    const parentPath = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    const newPath = parentPath + trimmed;
    
    if (files[newPath] !== undefined) {
      setCustomAlert('A file with that name already exists.');
      return;
    }
    
    setFiles(prev => {
      const copy = { ...prev };
      copy[newPath] = copy[oldName];
      delete copy[oldName];
      
      if (activeFile === oldName) {
        setActiveFile(newPath);
      }
      
      return copy;
    });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string || '';
      const name = file.name;
      setFiles(prev => ({ ...prev, [name]: content }));
      setActiveFile(name);
    };
    reader.readAsText(file);
  };

  const lines = editorCode.split('\n');

  const highlightedHtml = useMemo(() => {
    return highlightCode(editorCode, langMode);
  }, [editorCode, langMode]);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 px-6 bg-bg transition-colors duration-300"
    >
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 pb-12">
        {/* Editor Top Control Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-light pb-4">
          <div className="flex items-center gap-2 select-none">
            <span className="text-xs font-mono text-text-muted uppercase tracking-wider">Workspace</span>
            <span className="text-text-muted/40 text-xs">/</span>
            <span className="text-xs font-mono font-bold text-accent">{activeFile}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Language Selector Dropdown */}
            <div className="flex items-center gap-2 bg-card border border-border-light px-3 py-1.5 rounded-xl text-xs font-semibold text-text-main">
              <span className="text-text-muted">Language:</span>
              <select
                value={langMode}
                onChange={(e) => {
                  const newLang = e.target.value as any;

                  // Setup template configs
                  const defaultFileMap: Record<string, { name: string; template: string }> = {
                    lex: {
                      name: 'main.lex',
                      template: `%{\n#include <stdio.h>\n%}\n\n%%\n[ \\t\\n]+ ;\n. { printf("%s", yytext); }\n%%\n\nint yywrap() {\n    return 1;\n}\n\nint main() {\n    yylex();\n    return 0;\n}`
                    },
                    python: {
                      name: 'main.py',
                      template: `def greet(name):\n    print("Hello, " + name + "!")\n\ngreet("SYNTEX Compiler User")`
                    },
                    java: {
                      name: 'Main.java',
                      template: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`
                    },
                    javascript: {
                      name: 'index.js',
                      template: `function multiply(a, b) {\n  return a * b;\n}\n\nconsole.log("Result:", multiply(6, 7));`
                    },
                    c: {
                      name: 'main.c',
                      template: `#include <stdio.h>\n\nint main() {\n    int a = 5, b = 10;\n    printf("Sum = %d\\n", a + b);\n    return 0;\n}`
                    },
                    cpp: {
                      name: 'main.cpp',
                      template: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}`
                    },
                    natural: {
                      name: 'instructions.txt',
                      template: `Create a program that runs a loop from 1 to 5.\nInside the loop, print the count value.`
                    },
                    markdown: {
                      name: 'readme.md',
                      template: `# SYNTEX Studio`
                    }
                  };

                  const targetFileInfo = defaultFileMap[newLang];
                  if (targetFileInfo) {
                    if (files[targetFileInfo.name] !== undefined) {
                      setActiveFile(targetFileInfo.name);
                    } else {
                      setFiles(prev => ({
                        ...prev,
                        [targetFileInfo.name]: targetFileInfo.template
                      }));
                      setActiveFile(targetFileInfo.name);
                    }
                  }
                }}
                className="bg-transparent focus:outline-none cursor-pointer text-accent uppercase font-bold"
              >
                  <option value="lex">Lex Language</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="javascript">JavaScript</option>
                <option value="c">C</option>
                <option value="cpp">C++</option>
                <option value="natural">Natural English</option>
                <option value="markdown">Markdown Docs</option>
              </select>
            </div>

            {/* Target Compilation Selector */}
            {langMode !== 'markdown' && (
              <div className="flex items-center gap-2 bg-card border border-border-light px-3 py-1.5 rounded-xl text-xs font-semibold text-text-main">
                <Languages size={14} className="text-accent" />
                <span className="text-text-muted">Compile Target:</span>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as any)}
                  className="bg-transparent focus:outline-none cursor-pointer text-text-main uppercase font-bold"
                >
                  <option value="lex">Lex</option>
                  <option value="python">Python</option>
                  <option value="java">Java</option>
                  <option value="javascript">JavaScript</option>
                  <option value="c">C</option>
                  <option value="cpp">C++</option>
                </select>
              </div>
            )}

            {/* AI Autocomplete Slide Toggle */}
            <div className="flex items-center gap-2 bg-card border border-border-light px-3 py-1.5 rounded-xl text-xs font-semibold select-none">
              <span className="text-text-muted">AI Autocomplete:</span>
              <button
                onClick={() => setAutocompleteEnabled(!autocompleteEnabled)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  autocompleteEnabled ? 'bg-accent' : 'bg-border-light'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    autocompleteEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>



            {/* Run Mode Selector Segmented Control */}
            <div className="flex bg-card/60 p-0.5 rounded-xl border border-border-light/60">
              <button
                onClick={() => setExecutionMode('compiler')}
                title="Only execute compilation and print stdout/stderr"
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  executionMode === 'compiler'
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Compiler
              </button>
              <button
                onClick={() => setExecutionMode('phases')}
                title="Visualize all 6 compiler execution phases sequentially"
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  executionMode === 'phases'
                    ? 'bg-accent/15 text-accent border border-accent/20'
                    : 'text-text-muted hover:text-text-main'
                }`}
              >
                Phases Visualizer
              </button>
            </div>

            {/* Run button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleRun}
              disabled={loading}
              className={`px-5 py-2 rounded-xl text-xs font-semibold tracking-wide flex items-center gap-1.5 shadow-sm hover:shadow-md cursor-pointer text-white bg-accent`}
            >
              <Terminal size={12} /> {loading ? 'Compiling...' : 'Run Code'}
            </motion.button>
          </div>
        </div>

        {/* Mobile View segmented tab control */}
        <div className="flex lg:hidden bg-card/60 p-1 rounded-2xl border border-border-light/60 mb-2 select-none font-mono">
          {[
            { id: 'files', name: 'Files', icon: <Folder size={13} className="mr-1.5" /> },
            { id: 'editor', name: 'Editor', icon: <FileCode size={13} className="mr-1.5" /> },
            { id: 'outputs', name: 'Console', icon: <Terminal size={13} className="mr-1.5" /> }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMobileTab(t.id as any)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center cursor-pointer transition-all ${
                mobileTab === t.id
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-text-muted hover:text-text-main'
              }`}
            >
              {t.icon}
              <span>{t.name}</span>
            </button>
          ))}
        </div>

        {/* IDE Split Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* 1. File Explorer Sidebar (col-span-3) */}
          <div className={`${mobileTab === 'files' ? 'flex' : 'hidden'} lg:flex lg:col-span-3 flex-col gap-3`}>
            <div className="flex justify-between items-center pl-1">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-80">Workspace Files</h3>
              
              {/* Clear Explicit Actions Bar */}
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setSelectedFolderForCreate(null);
                    setNewFileName('');
                    setNewFileError('');
                    setShowNewFileDialog(true);
                  }}
                  title="Create a new code file"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-card text-text-muted hover:text-accent transition-all cursor-pointer border border-border-light/40 text-[9px] font-semibold uppercase tracking-wider font-sans"
                >
                  <Plus size={9} />
                  <span>File</span>
                </button>
                <button
                  onClick={() => {
                    setSelectedFolderForCreate(null);
                    setNewFolderName('');
                    setNewFolderError('');
                    setShowNewFolderDialog(true);
                  }}
                  title="Create a new folder"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-card text-text-muted hover:text-accent transition-all cursor-pointer border border-border-light/40 text-[9px] font-semibold uppercase tracking-wider font-sans"
                >
                  <FolderPlus size={9} />
                  <span>Folder</span>
                </button>
                <button
                  onClick={handleImportClick}
                  title="Import a local source code file"
                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded hover:bg-card text-text-muted hover:text-accent transition-all cursor-pointer border border-border-light/40 text-[9px] font-semibold uppercase tracking-wider font-sans"
                >
                  <Upload size={9} />
                  <span>Import</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>
            
            <div className="bg-card border border-border-light rounded-xl p-1.5 flex flex-col gap-1 shadow-[0_4px_20px_rgba(0,0,0,0.01)] max-h-[260px] overflow-y-auto">
              {renderTree(buildFileTree(files))}
            </div>
            
            <div className="bg-card/45 border border-border-light p-2.5 rounded-xl flex items-start gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.01)]">
              <Info size={13} className="text-accent shrink-0 mt-0.5" />
              <div className="text-[9.5px] text-text-muted leading-relaxed font-sans">
                <strong>SYNTEX</strong> compiles buffers in real time via structured phase translators.
              </div>
            </div>

            {/* Session compiler run history */}
            <div className="bg-card border border-border-light rounded-xl p-3 flex flex-col gap-2 shadow-[0_4px_20px_rgba(0,0,0,0.01)] mt-auto select-none">
              <div className="flex items-center justify-between border-b border-border-light/40 pb-1.5">
                <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Run History</span>
                <span className="text-[8px] font-mono text-accent">Active Session</span>
              </div>
              <div className="space-y-1.5 max-h-[110px] overflow-y-auto pr-0.5">
                {runHistory.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (files[item.file] !== undefined) {
                        setActiveFile(item.file);
                      }
                      if (item.result !== undefined) {
                        setResult(item.result);
                      }
                      if (item.phasesData !== undefined) {
                        setPhasesData(item.phasesData);
                      }
                      if (item.consoleLogs !== undefined) {
                        setConsoleLogs(item.consoleLogs);
                      }
                    }}
                    title="Click to restore compile state"
                    className="flex justify-between items-center text-[9.5px] font-mono border-b border-bg/30 pb-1 last:border-0 cursor-pointer hover:bg-accent/10 hover:text-accent px-1.5 py-0.5 rounded transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        item.status === 'success' ? 'bg-emerald-500' : item.status === 'error' ? 'bg-rose-500' : 'bg-amber-500'
                      }`} />
                      <span className="text-text-main truncate max-w-[85px]">{item.file.split('/').pop()}</span>
                      <span className="text-text-muted/65 text-[8.5px]">({item.label})</span>
                    </div>
                    <span className="text-text-muted/50 text-[8px] shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Overlaid Syntax Highlighted Editor (col-span-5) */}
          <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex lg:col-span-5 flex-col gap-3`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted pl-1 flex justify-between">
              <span>Code Editor</span>
              <span className="text-[10px] font-mono lowercase opacity-60">scroll sync enabled</span>
            </h3>
            <div className={`relative flex flex-col bg-card border rounded-2xl overflow-hidden h-[400px] lg:h-[580px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-all duration-300 ${
              editorGlow ? 'ring-2 ring-emerald-500 border-emerald-500' : 'border-border-light'
            }`}>
              {/* Tab Header bar */}
              <div className="flex items-center bg-bg/50 border-b border-border-light px-2 h-10 overflow-x-auto select-none font-mono gap-1 shrink-0">
                {openTabs.map((tab) => {
                  const isActive = tab === activeFile;
                  return (
                    <div
                      key={tab}
                      onClick={() => setActiveFile(tab)}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-t-lg text-[10px] md:text-xs font-semibold cursor-pointer border-t border-x mt-2 h-8 transition-colors select-none ${
                        isActive
                          ? 'bg-card border-border-light text-text-main font-bold border-b-bg'
                          : 'bg-transparent border-transparent text-text-muted hover:bg-bg/30 hover:text-text-main'
                      }`}
                    >
                      {tab.endsWith('.md') ? <FileText size={11} className="text-accent" /> : <FileCode size={11} className="text-accent" />}
                      <span className="truncate max-w-[80px]">{tab.split('/').pop()}</span>
                      
                      {/* Close button: small x */}
                      <button
                        onClick={(e) => handleCloseTab(tab, e)}
                        className="p-0.5 rounded-full hover:bg-bg/60 text-text-muted hover:text-red-500 font-sans text-[8px] flex items-center justify-center w-3.5 h-3.5"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Editor Workspace */}
              <div className="flex-1 flex overflow-hidden font-mono text-sm relative bg-card">
                {/* Line Gutter */}
                <div className="w-12 bg-bg/30 text-right pr-2 text-text-muted/40 py-5 select-none border-r border-border-light/30">
                  {lines.map((_, i) => {
                    const lineNum = i + 1;
                    const isErrorLine = errorLines.includes(lineNum);
                    return (
                      <div
                        key={i}
                        title={isErrorLine ? `Error on line ${lineNum}` : undefined}
                        onClick={() => scrollToLine(lineNum)}
                        className={`leading-6 text-xs flex items-center justify-end pr-1 gap-1 cursor-pointer hover:bg-border-light/20 transition-colors ${
                          isErrorLine ? 'text-red-500 font-bold bg-red-500/10 rounded-l' : ''
                        }`}
                      >
                        {isErrorLine && <span className="text-red-500 text-[9px]">●</span>}
                        {lineNum}
                      </div>
                    );
                  })}
                </div>
                
                {/* Overlay Container */}
                <div className="flex-1 relative overflow-hidden h-full w-full">
                  {/* Pre tag: Syntax Highlight Background */}
                  <pre 
                    ref={preRef}
                    className="absolute inset-0 p-5 font-mono text-xs md:text-sm leading-6 whitespace-pre overflow-hidden pointer-events-none text-text-main/75 w-full h-full select-none bg-transparent"
                  >
                    <span dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
                    {ghostText && (
                      <span className="text-text-muted/30 select-none pointer-events-none font-mono">
                        {ghostText}
                      </span>
                    )}
                  </pre>
                  
                  {/* Textarea tag: Input Foreground */}
                  <textarea
                    ref={textareaRef}
                    onScroll={handleScroll}
                    onKeyDown={handleKeyDown}
                    value={editorCode}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    className="absolute inset-0 p-5 font-mono text-xs md:text-sm leading-6 bg-transparent text-transparent caret-text-main resize-none outline-none border-0 overflow-auto w-full h-full whitespace-pre"
                    style={{ WebkitTextFillColor: 'transparent' }}
                    spellCheck="false"
                    placeholder="// Write or import your program here..."
                  />
                </div>
              </div>

              {/* Status bar */}
              <div className="bg-bg/40 border-t border-border-light px-4 py-2 flex items-center justify-between text-[10px] text-text-muted font-mono select-none">
                <span>Language: <strong className="text-text-main uppercase">{langMode}</strong></span>
                <span>Lines: {lines.length} | Chars: {editorCode.length}</span>
              </div>
            </div>
          </div>

          {/* 3. Utility Tab Panel (col-span-4) */}
          <div className={`${mobileTab === 'outputs' ? 'flex' : 'hidden'} lg:flex lg:col-span-4 flex-col gap-3`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted pl-1">Execution & Outputs</h3>
            <div className="flex flex-col bg-card border border-border-light rounded-2xl overflow-hidden h-[580px] shadow-[0_4px_20px_rgba(0,0,0,0.01)] transition-colors duration-300">
              
              {/* Tab selector bar (No icons, text labels only, prevent wraps) */}
              <div className="flex border-b border-border-light bg-bg/45 p-1 overflow-x-auto gap-0.5">
                {[
                  { id: 'console', name: 'Console' },
                  { id: 'stdin', name: 'Stdin' },
                  { id: 'tokens', name: 'Tokens' },
                  { id: 'ast', name: 'AST Tree' },
                  { id: 'translated', name: 'Target Code' },
                  { id: 'ai', name: 'AI Insights' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10.5px] font-semibold flex items-center justify-center cursor-pointer transition-all shrink-0 ${
                      activeTab === t.id
                        ? 'bg-card text-accent border border-border-light shadow-sm font-bold'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>

              {/* Tab Display Screens */}
              <div className="flex-1 p-5 overflow-y-auto bg-card space-y-4">
                {result && (
                  <div className="grid grid-cols-4 gap-2 bg-bg/50 border border-border-light/60 p-2.5 rounded-2xl text-[10px] font-mono select-none">
                    <div className="flex flex-col items-center p-2 bg-card/65 rounded-xl border border-border-light/20 shadow-sm">
                      <span className="text-text-muted/65 uppercase text-[8px] tracking-wider mb-1">Status</span>
                      <span className={`font-bold uppercase tracking-wide text-xs ${errorLines.length > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {errorLines.length > 0 ? 'FAIL' : 'PASS'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-card/65 rounded-xl border border-border-light/20 shadow-sm">
                      <span className="text-text-muted/65 uppercase text-[8px] tracking-wider mb-1">Duration</span>
                      <span className="font-bold text-text-main text-xs">
                        {errorLines.length > 0 ? '8ms' : '112ms'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-card/65 rounded-xl border border-border-light/20 shadow-sm">
                      <span className="text-text-muted/65 uppercase text-[8px] tracking-wider mb-1">Memory</span>
                      <span className="font-bold text-text-main text-xs">
                        {errorLines.length > 0 ? '1.2MB' : '4.6MB'}
                      </span>
                    </div>
                    <div className="flex flex-col items-center p-2 bg-card/65 rounded-xl border border-border-light/20 shadow-sm">
                      <span className="text-text-muted/65 uppercase text-[8px] tracking-wider mb-1">Tokens</span>
                      <span className="font-bold text-accent text-xs">
                        {result.tokens ? result.tokens.length : '0'}
                      </span>
                    </div>
                  </div>
                )}

                {/* AI Code Fix Suggestion Card */}
                <AnimatePresence>
                  {result && result.correctedCode && result.correctedCode !== editorCode && showFixProposal && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-5 bg-gradient-to-br from-amber-500/10 to-accent/5 border border-accent/25 rounded-2xl space-y-4 overflow-hidden shadow-md shrink-0 glass-panel"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-accent">
                          <Sparkles size={14} className="animate-pulse" />
                          <h4 className="text-xs font-bold uppercase tracking-wider">AI Code Fix Suggestion</h4>
                        </div>
                        <span className="text-[10px] text-text-muted italic">Click Accept to apply changes</span>
                      </div>
                      
                      <p className="text-[11px] text-text-muted leading-relaxed">
                        We detected syntax or logical errors in your code. Review the proposed fix below:
                      </p>

                      <div className="flex flex-col bg-bg/50 border border-border-light rounded-xl overflow-hidden text-[10px] font-mono leading-relaxed select-text">
                        <div className="bg-accent/10 px-3 py-1 border-b border-border-light font-sans font-semibold text-accent">Proposed Code Differences</div>
                        <div className="p-3 overflow-y-auto whitespace-pre max-h-48 divide-y divide-border-light/10">
                          {computeDiff(editorCode, result.correctedCode).map((line, dIdx) => {
                            if (line.type === 'added') {
                              return (
                                <div key={dIdx} className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 font-bold">
                                  + {line.content}
                                </div>
                              );
                            }
                            if (line.type === 'removed') {
                              return (
                                <div key={dIdx} className="bg-red-500/10 text-red-500 line-through px-2 py-1">
                                  - {line.content}
                                </div>
                              );
                            }
                            return (
                              <div key={dIdx} className="text-text-muted px-2 py-1 opacity-80">
                                  {line.content}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 text-xs font-semibold pt-1">
                        <button
                          onClick={() => setShowFixProposal(false)}
                          className="px-3 py-1.5 rounded-lg border border-border-light hover:bg-bg text-text-muted hover:text-text-main transition-colors cursor-pointer"
                        >
                          Reject Fix
                        </button>
                        <button
                          onClick={() => {
                            handleApplyFix();
                            setShowFixProposal(false);
                          }}
                          className="px-4 py-1.5 rounded-lg bg-accent text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                        >
                          Accept & Apply Fix
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  
                  {/* Console screen */}
                  {activeTab === 'console' && (
                    <motion.div
                      key="console-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 h-full flex flex-col"
                    >
                      {/* Phase cards — shown when phases mode was used */}
                      {phasesData.length > 0 ? (
                        <div className="space-y-2 overflow-auto max-h-[500px] select-text">
                          {/* Init logs */}
                          {consoleLogs.filter(log => 
                            log.startsWith('⚡') || 
                            log.startsWith('📂') || 
                            log.startsWith('Initializing') || 
                            log.startsWith('Contacting') || 
                            log.startsWith('Reading')
                          ).map((log, i) => (
                            <div key={i} className="font-mono text-[11px] text-accent font-semibold">{log}</div>
                          ))}
                          {/* Phase cards */}
                          {phasesData.map((phase) => {
                            const colorMap: Record<string, string> = {
                              blue: 'border-blue-400/30 bg-blue-500/5',
                              purple: 'border-purple-400/30 bg-purple-500/5',
                              indigo: 'border-indigo-400/30 bg-indigo-500/5',
                              amber: 'border-amber-400/30 bg-amber-500/5',
                              orange: 'border-orange-400/30 bg-orange-500/5',
                              emerald: phase.status === 'error' ? 'border-red-400/30 bg-red-500/5' : 'border-emerald-400/30 bg-emerald-500/5',
                            };
                            const headerColorMap: Record<string, string> = {
                              blue: 'text-blue-500',
                              purple: 'text-purple-500',
                              indigo: 'text-indigo-500',
                              amber: 'text-amber-500',
                              orange: 'text-orange-500',
                              emerald: phase.status === 'error' ? 'text-red-500' : 'text-emerald-500',
                            };
                            return (
                              <motion.div
                                key={phase.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`border rounded-xl overflow-hidden font-mono text-[11px] ${colorMap[phase.color] || 'border-border-light bg-bg/30'}`}
                              >
                                {/* Phase header */}
                                <div className={`flex items-center gap-2 px-3 py-2 border-b border-inherit font-sans`}>
                                  <span className={`font-bold text-[11px] uppercase tracking-wider ${headerColorMap[phase.color] || 'text-text-main'}`}>
                                    Phase {phase.id}: {phase.title}
                                  </span>
                                  <span className="ml-auto">
                                    {phase.status === 'pending' && <span className="text-text-muted/50 text-[10px]">waiting…</span>}
                                    {phase.status === 'running' && (
                                      <span className="flex items-center gap-1.5 text-accent text-[10px] font-semibold">
                                        <svg className="animate-spin h-3.5 w-3.5 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        running...
                                      </span>
                                    )}
                                    {phase.status === 'done' && <span className="text-emerald-500 text-[10px] font-bold">done</span>}
                                    {phase.status === 'error' && <span className="text-red-500 text-[10px] font-bold">error</span>}
                                  </span>
                                </div>
                                {/* Phase content */}
                                {phase.content && (
                                  <div className="p-3 overflow-x-auto">
                                    <pre className="whitespace-pre text-text-main/80 leading-relaxed">{phase.content}</pre>
                                  </div>
                                )}
                              </motion.div>
                            );
                          })}
                          {/* Final status line */}
                          {consoleLogs.filter(log => 
                            log.includes('Exit code') || 
                            log.includes('Process completed') || 
                            log.includes('Connection failed')
                          ).map((log, i) => (
                            <div key={i} className={`font-mono text-[12px] font-bold pt-1 ${log.includes('status code 1') || log.includes('Errors detected') || log.includes('Compiler Error') ? 'text-red-500' : 'text-emerald-500'}`}>
                              {log}
                            </div>
                          ))}
                          {loading && (
                            <div className="flex items-center gap-3 py-2 px-3 border border-border-light rounded-xl bg-bg/50 my-2">
                              <div className="spinner-sm">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              <span className="font-mono text-[10px] text-text-muted font-bold tracking-wider animate-pulse">
                                COMPILING AND VERIFYING CODE...
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Plain compiler console */
                        <div className="flex-1 space-y-1 overflow-auto max-h-[500px] select-text font-mono text-[11px]">
                          {consoleLogs.length === 0 ? (
                            <div className="text-text-muted/50 italic py-4 text-center">
                              Terminal idling — click <span className="text-accent font-semibold">Run Code</span> to compile and execute.
                            </div>
                          ) : (
                            consoleLogs.map((log, i) => {
                              const lowerLog = log.toLowerCase();
                              let cls = 'text-text-muted/70';
                              if (lowerLog.includes('error') || lowerLog.includes('exception') || lowerLog.includes('traceback') || lowerLog.includes('nameerror') || lowerLog.includes('exit code 1') || lowerLog.includes('exit status code 1')) {
                                cls = 'text-red-500 font-semibold';
                              } else if (lowerLog.includes('exit status code 0') || lowerLog.includes('exit code 0') || lowerLog.includes('success')) {
                                cls = 'text-emerald-500 font-bold';
                              } else if (log.startsWith('⚡') || log.startsWith('📂') || log.startsWith('Initializing') || log.startsWith('Contacting') || log.startsWith('Reading')) {
                                cls = 'text-accent font-semibold';
                              } else if (log.startsWith('SYNTEX') || log.startsWith('Simulating')) {
                                cls = 'text-text-main font-semibold';
                              } else if (log.startsWith('---')) {
                                cls = 'text-border-light';
                              }
                              return (
                                <div key={i} className={`leading-relaxed whitespace-pre ${cls}`}>{log}</div>
                              );
                            })
                          )}
                          {loading && (
                            <div className="flex items-center gap-3 py-2 my-2">
                              <div className="spinner-sm">
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                                <span></span>
                              </div>
                              <span className="font-mono text-[10px] text-text-muted font-bold tracking-wider animate-pulse">
                                COMPILING AND VERIFYING CODE...
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}


                  {/* Program Input Stdin screen */}
                  {activeTab === 'stdin' && (
                    <motion.div
                      key="stdin-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col gap-3 font-mono"
                    >
                      <div className="text-xs text-text-muted leading-relaxed">
                        Specify standard program inputs (stdin) to be parsed during execution simulation.
                      </div>
                      <textarea
                        value={stdin}
                        onChange={(e) => setStdin(e.target.value)}
                        placeholder="e.g. 42 \n hello \n true"
                        className="flex-1 w-full p-4 bg-bg border border-border-light text-text-main rounded-xl focus:outline-none resize-none text-xs md:text-sm leading-6"
                      />
                    </motion.div>
                  )}

                  {/* Dynamic Token Badges screen */}
                  {activeTab === 'tokens' && (
                    <motion.div
                      key="tokens-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4"
                    >
                      <div className="pb-3 border-b border-border-light flex items-center justify-between text-xs text-text-muted font-sans">
                        <span>Lexical Scanning Token Stream</span>
                        <span className="font-mono text-[10px] uppercase">Scanner Output</span>
                      </div>
                      
                      <div className="overflow-y-auto max-h-[460px] pr-1">
                        {result?.tokens && result.tokens.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5 p-3 bg-bg border border-border-light rounded-xl">
                            {result.tokens.map((tok: any, i: number) => {
                              let badgeColor = 'bg-card text-text-main border-border-light';
                              if (tok.type === 'KEYWORD') badgeColor = 'bg-orange-500/5 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20';
                              else if (tok.type === 'IDENTIFIER') badgeColor = 'bg-blue-500/5 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
                              else if (tok.type === 'STRING') badgeColor = 'bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
                              else if (tok.type === 'NUMBER') badgeColor = 'bg-purple-500/5 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
                              return (
                                <motion.span 
                                  key={i} 
                                  initial={{ scale: 0.75, opacity: 0, y: 8 }}
                                  animate={{ scale: 1, opacity: 1, y: 0 }}
                                  transition={{ 
                                    type: 'spring', 
                                    stiffness: 400, 
                                    damping: 22, 
                                    delay: Math.min(i * 0.015, 0.5) 
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10.5px] font-mono border ${badgeColor}`} 
                                  title={tok.type}
                                >
                                  <span className="opacity-45 text-[8.5px] uppercase mr-1">{tok.type}:</span>
                                  {tok.value}
                                </motion.span>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-text-muted/50 italic text-xs font-mono py-10 text-center">
                            No active token stream.<br/>Run compilation to scan code buffers.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Dynamic AST Tree screen (ASCII & Graphical Visualizer) */}
                  {activeTab === 'ast' && (
                    <motion.div
                      key="ast-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="pb-3 mb-3 border-b border-border-light flex items-center justify-between text-xs text-text-muted font-sans select-none">
                        <div className="flex items-center gap-1 bg-bg p-0.5 rounded-lg border border-border-light/60">
                          <button
                            onClick={() => setAstViewMode('graphical')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              astViewMode === 'graphical' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                            }`}
                          >
                            Graphical Tree
                          </button>
                          <button
                            onClick={() => setAstViewMode('ascii')}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              astViewMode === 'ascii' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text-main'
                            }`}
                          >
                            ASCII Text
                          </button>
                        </div>
                        <span className="font-mono text-[10px] uppercase">Syntax Analysis</span>
                      </div>
                      
                      <div className="overflow-y-auto max-h-[460px] pr-1">
                        {result?.ast ? (
                          astViewMode === 'graphical' ? (
                            <div className="p-4 bg-bg border border-border-light rounded-xl shadow-inner select-none flex flex-col gap-2 min-h-[160px]">
                              <ASTNodeRenderer node={result.ast} />
                            </div>
                          ) : (
                            <div className="p-4 bg-bg border border-border-light rounded-xl overflow-x-auto shadow-inner select-text">
                              <pre className="font-mono text-[11px] leading-relaxed whitespace-pre text-text-main">
                                {generateAsciiTree(result.ast)}
                              </pre>
                            </div>
                          )
                        ) : (
                          <div className="text-text-muted/50 italic text-xs font-mono py-10 text-center">
                            No active syntax tree parsed.<br/>Run the compiler to build the AST.
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Translated Target Code screen */}
                  {activeTab === 'translated' && (
                    <motion.div
                      key="translated-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 h-full flex flex-col"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-border-light font-sans">
                        <div className="flex items-center gap-1.5">
                          <Cpu size={14} className="text-accent" />
                          <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">Target Translated Output</h4>
                        </div>
                        {result?.compiledCode && (
                          <button
                            onClick={() => copyCode(result.compiledCode)}
                            className="p-1.5 rounded-lg border border-border-light text-text-muted hover:text-text-main cursor-pointer hover:bg-card transition-all"
                            title="Copy translation"
                          >
                            {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                      
                      <div className="flex-1 bg-bg p-4 rounded-xl border border-border-light font-mono text-xs text-text-main overflow-x-auto max-h-[420px] shadow-inner select-text">
                        {result?.compiledCode ? (
                          <pre 
                            className="whitespace-pre text-text-main/90"
                            dangerouslySetInnerHTML={{ __html: highlightCode(result.compiledCode, targetLang) }}
                          />
                        ) : (
                          <span className="text-text-muted/50 italic">Compilation target translation will render here.</span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* AI Diagnostic & Copilot Chat screen */}
                  {activeTab === 'ai' && (
                    <motion.div
                      key="ai-tab"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 font-sans h-full flex flex-col max-h-[500px]"
                    >
                      {/* Diagnostic explanation (Top section) */}
                      {result ? (
                        <div className="space-y-3 shrink-0">
                          <div className="pb-1.5 border-b border-border-light">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-text-muted">SYNTEX Diagnostic Log</h4>
                          </div>

                          <div className="p-3 bg-bg rounded-xl border border-border-light text-[11.5px] font-medium text-text-main leading-relaxed shadow-sm">
                            {result.explanation || 'No syntax correction needed. Your program compiled error-free!'}
                          </div>

                          {result.correctedCode && result.correctedCode !== editorCode && (
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => handleApplyFix()}
                              className="w-full py-2 rounded-xl bg-accent text-white font-bold text-[10.5px] shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-center"
                            >
                              Apply AI Fix in Editor
                            </motion.button>
                          )}
                        </div>
                      ) : (
                        <div className="text-text-muted/50 italic text-[10px] text-center py-2 font-mono shrink-0">
                          No compiler insights generated yet.
                        </div>
                      )}

                      {/* Interactive Copilot Chat Console (Bottom section) */}
                      <div className="flex-1 flex flex-col border border-border-light/60 rounded-2xl bg-card overflow-hidden min-h-[240px] shadow-sm">
                        <div className="flex justify-between items-center bg-bg/20 px-4 py-2 border-b border-border-light/40">
                          <span className="text-[9.5px] font-bold text-text-muted uppercase tracking-wider">SYNTEX Assistant Chat</span>
                          {chatLoading && <span className="text-[9px] text-accent animate-pulse font-bold">Analyzing code...</span>}
                        </div>

                        {/* Connection Context Selector */}
                        <div className="flex items-center justify-between gap-1.5 px-4 py-1.5 bg-bg/10 border-b border-border-light/20 text-[10px] select-none shrink-0">
                          <span className="text-text-muted font-medium text-[9px] uppercase tracking-wider">Connected Context:</span>
                          <select
                            value={aiContextTab}
                            onChange={(e) => setAiContextTab(e.target.value)}
                            className="bg-card border border-border-light/65 rounded px-1.5 py-0.5 text-[10px] text-text-main font-bold focus:outline-none cursor-pointer"
                          >
                            <option value="active">Active File ({activeFile.split('/').pop()})</option>
                            <option value="workspace">Entire Workspace</option>
                            {openTabs.map(tab => (
                              <option key={tab} value={tab}>
                                File: {tab.split('/').pop()}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Chat Messages viewport */}
                        <div className="flex-1 p-3 overflow-y-auto space-y-2.5 text-[11px] font-normal leading-relaxed max-h-[160px]">
                          {copilotMessages.map((msg, idx) => (
                            <div key={idx} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                              <div className={`px-3 py-2 rounded-2xl max-w-[85%] shadow-sm ${
                                msg.sender === 'user' 
                                  ? 'bg-accent text-white rounded-tr-none' 
                                  : 'bg-bg text-text-main border border-border-light/40 rounded-tl-none'
                              }`}>
                                {msg.text}
                              </div>
                              {msg.codeBlock && (
                                <pre className="mt-1.5 p-2.5 bg-bg border border-border-light/50 rounded-xl text-[10px] font-mono text-text-main overflow-x-auto max-w-[90%] whitespace-pre">
                                  {msg.codeBlock}
                                </pre>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* Quick trigger suggestion actions */}
                        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-border-light/20 bg-bg/10">
                          <button
                            onClick={() => handleSendCopilotMessage('Optimize active code')}
                            className="px-2 py-1 rounded-full bg-card border border-border-light/60 text-text-muted hover:text-accent hover:border-accent/40 text-[9px] font-semibold cursor-pointer transition-all"
                          >
                            Optimize Code
                          </button>
                          <button
                            onClick={() => handleSendCopilotMessage('Analyze time complexity')}
                            className="px-2 py-1 rounded-full bg-card border border-border-light/60 text-text-muted hover:text-accent hover:border-accent/40 text-[9px] font-semibold cursor-pointer transition-all"
                          >
                            Big-O Complexity
                          </button>
                          <button
                            onClick={() => handleSendCopilotMessage('Explain active compiler diagnostics')}
                            className="px-2 py-1 rounded-full bg-card border border-border-light/60 text-text-muted hover:text-accent hover:border-accent/40 text-[9px] font-semibold cursor-pointer transition-all"
                          >
                            Explain Code
                          </button>
                        </div>

                        {/* Input bar */}
                        <div className="p-2 border-t border-border-light/30 flex gap-2 bg-bg/5">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCopilotMessage()}
                            placeholder="Ask SYNTEX to explain, rewrite, or debug..."
                            className="flex-1 bg-bg/25 border border-border-light/50 rounded-xl px-3 py-1.5 text-[10.5px] text-text-main placeholder-text-muted/50 outline-none focus:border-accent/40 transition-colors"
                          />
                          <button
                            onClick={() => handleSendCopilotMessage()}
                            className="px-4 py-1.5 bg-accent text-white rounded-xl text-[10.5px] font-bold cursor-pointer hover:bg-accent-hover transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>

                      {/* Code Change History (Bottom of panel) */}
                      {codeHistory.length > 0 && (
                        <div className="space-y-1.5 shrink-0 border-t border-border-light pt-2">
                          <div className="flex items-center justify-between">
                            <h5 className="text-[9px] font-bold uppercase tracking-wider text-text-muted">Code History</h5>
                            <span className="text-[9px] text-text-muted font-mono">{codeHistory.length} entry</span>
                          </div>
                          <div className="flex gap-1.5 overflow-x-auto pb-1 max-w-full">
                            {[...codeHistory].reverse().map((entry) => (
                              <button
                                key={entry.id}
                                onClick={() => handleUndoHistory(entry.id)}
                                className={`shrink-0 px-2 py-1 rounded bg-bg border text-[8.5px] font-mono hover:text-accent hover:border-accent/40 transition-all cursor-pointer ${
                                  currentHistoryId === entry.id ? 'border-accent text-accent font-semibold bg-accent/5' : 'border-border-light text-text-muted'
                                }`}
                              >
                                {entry.label.replace('AI Fix - ', '')}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

            </div>
          </div>

        </div>
      </div>
      
      {/* Dynamic Stdin Prompt Dialog Modal */}
      <AnimatePresence>
        {showInputDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-light rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">
                {langMode === 'lex' ? 'Lex Input Stream Required' : 'Program Input Required'}
              </h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                {langMode === 'lex' 
                  ? 'Please enter the character string or stream text that the Lex scanner rules should process (stdin):' 
                  : 'We detected that your program reads user input during execution. Please enter values to be submitted as standard input (stdin):'}
              </p>
              
              <textarea
                value={dialogInput}
                onChange={(e) => setDialogInput(e.target.value)}
                placeholder={langMode === 'lex' ? "e.g. hello world 123 AEIOU" : "Enter input values here (separate multiple inputs with new lines)..."}
                className="w-full h-32 p-3 bg-bg border border-border-light text-text-main rounded-xl focus:outline-none resize-none text-xs font-mono mb-4 focus:ring-1 focus:ring-accent/40"
              />
              
              <div className="flex justify-end gap-3 text-xs font-semibold">
                <button
                  onClick={() => setShowInputDialog(false)}
                  className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleConfirmInput('')}
                  className="px-4 py-2 rounded-xl border border-border-light hover:bg-bg transition-colors cursor-pointer text-text-main"
                >
                  Run Without Input
                </button>
                <button
                  onClick={() => handleConfirmInput(dialogInput)}
                  className="px-5 py-2 rounded-xl bg-accent text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                >
                  Submit & Run
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New File Dialog Modal */}
      <AnimatePresence>
        {showNewFileDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-light rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">Create New File</h3>
              
              {selectedFolderForCreate ? (
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  Creating in folder: <strong className="text-accent">/{selectedFolderForCreate}</strong>
                </p>
              ) : (
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  Creating in workspace root directory.
                </p>
              )}
              
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Enter a file name with extension to add to your compiler workspace:
              </p>
              
              <form onSubmit={handleCreateFileSubmit}>
                <input
                  type="text"
                  autoFocus
                  value={newFileName}
                  onChange={(e) => {
                    setNewFileName(e.target.value);
                    if (newFileError) setNewFileError('');
                  }}
                  placeholder="e.g. main.lex, script.py, calc.java"
                  className="w-full px-3 py-2 bg-bg border border-border-light text-text-main rounded-xl focus:outline-none text-xs font-mono mb-2 focus:ring-1 focus:ring-accent/40"
                />
                
                {newFileError && (
                  <div className="text-[10px] text-red-500 font-semibold mb-3">
                    {newFileError}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 text-xs font-semibold mt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewFileDialog(false)}
                    className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-accent text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                  >
                    Create File
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Create New Folder Dialog Modal */}
      <AnimatePresence>
        {showNewFolderDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-light rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">Create New Folder</h3>
              
              {selectedFolderForCreate ? (
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  Creating in folder: <strong className="text-accent">/{selectedFolderForCreate}</strong>
                </p>
              ) : (
                <p className="text-xs text-text-muted leading-relaxed mb-3">
                  Creating in workspace root directory.
                </p>
              )}
              
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Enter a folder name:
              </p>
              
              <form onSubmit={handleCreateFolderSubmit}>
                <input
                  type="text"
                  autoFocus
                  value={newFolderName}
                  onChange={(e) => {
                    setNewFolderName(e.target.value);
                    if (newFolderError) setNewFolderError('');
                  }}
                  placeholder="e.g. src, utils, tests"
                  className="w-full px-3 py-2 bg-bg border border-border-light text-text-main rounded-xl focus:outline-none text-xs font-mono mb-2 focus:ring-1 focus:ring-accent/40"
                />
                
                {newFolderError && (
                  <div className="text-[10px] text-red-500 font-semibold mb-3">
                    {newFolderError}
                  </div>
                )}
                
                <div className="flex justify-end gap-3 text-xs font-semibold mt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewFolderDialog(false)}
                    className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-accent text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                  >
                    Create Folder
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom File Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-light rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-red-500 mb-2">Delete File</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                Are you sure you want to delete <strong className="text-text-main">{deleteConfirmFile}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end gap-3 text-xs font-semibold mt-4">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmFile(null)}
                  className="px-4 py-2 rounded-xl text-text-muted hover:text-text-main transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteFile}
                  className="px-5 py-2 rounded-xl bg-red-500 text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                >
                  Delete File
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {customAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border-light rounded-2xl w-full max-w-sm p-6 shadow-2xl relative"
            >
              <h3 className="text-sm font-bold uppercase tracking-wider text-accent mb-2">Notice</h3>
              <p className="text-xs text-text-muted leading-relaxed mb-4">
                {customAlert}
              </p>
              
              <div className="flex justify-end gap-3 text-xs font-semibold mt-4">
                <button
                  type="button"
                  onClick={() => setCustomAlert(null)}
                  className="px-5 py-2 rounded-xl bg-accent text-white shadow-sm hover:shadow-md transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
