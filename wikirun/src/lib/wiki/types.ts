export interface WikiArticle {
  title: string;
  html: string;
  displayTitle: string;
}

export interface WikiStep {
  title: string;
  timestamp_entered: number;
  timestamp_left: number | null;
  had_direct_link_to_target: boolean;
}

export interface ParsedWikiResponse {
  parse: {
    title: string;
    pageid: number;
    text: {
      "*": string;
    };
    links?: Array<{
      ns: number;
      exists?: string;
      "*": string;
    }>;
    displaytitle: string;
  };
}

export interface WikiError {
  error: {
    code: string;
    info: string;
  };
}
