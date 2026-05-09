export interface LoreSubmissionReferenceOption {
  id: string;
  label: string;
}

export interface LoreSubmissionAdminReferenceOptions {
  seasons: LoreSubmissionReferenceOption[];
  characters: LoreSubmissionReferenceOption[];
  locations: LoreSubmissionReferenceOption[];
}
