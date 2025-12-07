// 标准化的单词数据结构
export interface WordData {
  name: string; // 英文单词
  description: string; // 中文翻译
  metadata?: {
    pos?: string | null; // 词性
    level?: string | null; // 难度等级
    example?: string | null; // 例句
    prompt?: string | null; // 自检提示
    theme?: string | null; // 主题
    phonetic?: string | null; // 音标
    [key: string]: unknown; // 允许其他元数据
  };
}

