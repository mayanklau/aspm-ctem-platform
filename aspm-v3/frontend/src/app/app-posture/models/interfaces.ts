export interface AppScore {
  id?: string; app_id: string; app_name: string;
  business_unit?: string; domain?: string; asset_criticality?: string;
  sast_norm_score: number; dast_norm_score: number; sca_norm_score: number;
  bas_norm_score: number; cart_norm_score: number; fw_norm_score: number;
  waf_norm_score: number; ips_norm_score: number; siem_norm_score: number;
  pt_ext_norm_score: number; pt_int_norm_score: number; pt_mobile_norm_score: number;
  red_team_norm_score: number; audit_norm_score: number; os_comp_norm_score: number; db_comp_norm_score: number;
  new_app_security_score: number; cpr_score: number; final_posture_score: number;
  reports_assessed: string[]; reports_not_assessed: string[];
  coverage_percentage: number;
  total_critical: number; total_high: number; total_medium: number; total_low: number; total_open: number;
  last_computed_at?: string;
}
export interface ReportWeightage { id?: string; report_type: string; label: string; weightage: number; enabled: boolean; }
export interface IntegrationConfig {
  id: string; name: string; report_type: string; tool?: string; endpoint_url: string;
  auth_type: string; credentials?: any; poll_interval: string; enabled: boolean;
  last_sync_at?: string; last_sync_status?: string; last_sync_count?: number; last_error?: string;
}
export interface PagedResult<T> { data: T[]; meta: { total: number; page: number; limit: number; pages: number }; }
