export const SOCKET_EMIT_TYPES: string[] = [
  'social_media',
  'news',
  'topic_modeling',
  'sentiment',
  'hate_speech',
  'spam',
  'comment',
];

export const SOCKET_TYPE_LABEL: Record<string, string> = {
  social_media: 'Raw Timeline',
  news: 'Raw Timeline',
  topic_modeling: 'Topic Modeling',
  sentiment: 'Sentiment Analysis',
  hate_speech: 'Hate Speech',
  spam: 'Spam Detection',
  comment: 'Comments',
};
export const SOCKET_PROCESS_TYPE: string[] = ['link', 'comment'];

export const ACCOUNT_TYPE_LABEL = ['SAVINGS',
  'INVESTMENT',
  'EMERGENCY',
  'CASH',
  'OTHER']

export const CATEGORIES = ["Salary", "Freelance", "Business", "Investment", "Rental", "Gift", "Other"];