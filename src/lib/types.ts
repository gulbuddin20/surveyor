export type UserRole = "super_admin" | "regular_user";
export type TemplateStatus = "draft" | "active" | "archived";
export type ResponseStatus = "draft" | "submitted";
export type QuestionType =
  | "text"
  | "textarea"
  | "number"
  | "select"
  | "multiselect"
  | "radio"
  | "checkbox"
  | "photo";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type SurveyTemplate = {
  id: string;
  code: string;
  name: string;
  description: string;
  status: TemplateStatus;
  denominator: number;
  passing_score: number;
  source_document: string | null;
  created_at: string;
  updated_at: string;
};

export type SurveySection = {
  id: string;
  template_id: string;
  parent_id: string | null;
  title: string;
  sort_order: number;
  is_active: boolean;
};

export type SurveyQuestion = {
  id: string;
  template_id: string;
  section_id: string | null;
  label: string;
  help_text: string | null;
  question_type: QuestionType;
  weight: number;
  is_required: boolean;
  is_active: boolean;
  sort_order: number;
};

export type FormulaRule = {
  id: string;
  template_id: string;
  name: string;
  expression: string;
  denominator: number;
  passing_score: number;
  is_active: boolean;
};

export type MsmeSubject = {
  id: string;
  owner_id: string;
  business_name: string;
  owner_name: string | null;
  address: string | null;
  business_type: string | null;
  phone: string | null;
  metadata: Record<string, unknown>;
  updated_at: string;
  created_at: string;
};

export type SurveyResponse = {
  id: string;
  template_id: string;
  subject_id: string;
  surveyor_id: string;
  status: ResponseStatus;
  total_nonconformity: number;
  score: number;
  result_label: string;
  notes: string | null;
  submitted_at: string | null;
  updated_at: string;
  created_at: string;
};

export type SurveyAnswer = {
  id: string;
  response_id: string;
  question_id: string;
  is_nonconforming: boolean;
  value: Record<string, unknown>;
  score: number;
  notes: string | null;
};

export type SurveyPhoto = {
  id: string;
  response_id: string;
  question_id: string | null;
  storage_path: string;
  caption: string | null;
  created_at: string;
};

export type TemplateDetail = SurveyTemplate & {
  formula: FormulaRule | null;
  sections: SectionWithQuestions[];
};

export type SectionWithQuestions = SurveySection & {
  questions: SurveyQuestion[];
  children: SectionWithQuestions[];
};

export type TemplateAdminDetail = SurveyTemplate & {
  sections: SectionWithQuestions[];
  flatSections: SurveySection[];
};

export type DashboardStats = {
  totalResponses: number;
  submittedResponses: number;
  draftResponses: number;
  averageScore: number;
  totalSubjects: number;
  failedResponses: number;
};
