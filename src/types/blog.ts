export interface BlogSection {
  heading?: string;
  body: string;
  image?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  sections: BlogSection[];
  titleImage?: string;
}

export type QAContentBlock =
  | { type: "text"; content: string }
  | { type: "image"; src: string };

export interface QAItem {
  number: number;
  question: string;
  answer: string;
  content?: QAContentBlock[];
}
