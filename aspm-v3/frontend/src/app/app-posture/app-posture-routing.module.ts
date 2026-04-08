import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LandingComponent }       from './pages/landing/landing.component';
import { SastDetailComponent }    from './pages/sast/sast-detail.component';
import { DastDetailComponent }    from './pages/dast/dast-detail.component';
import { ScaDetailComponent }     from './pages/sca/sca-detail.component';
import { BasDetailComponent }     from './pages/bas/bas-detail.component';
import { CartDetailComponent }    from './pages/cart/cart-detail.component';
import { FirewallDetailComponent }from './pages/firewall/firewall-detail.component';
import { WafDetailComponent }     from './pages/waf/waf-detail.component';
import { IpsDetailComponent }     from './pages/ips/ips-detail.component';
import { SiemDetailComponent }    from './pages/siem/siem-detail.component';
import { PtExternalComponent }    from './pages/pt-external/pt-external.component';
import { PtInternalComponent }    from './pages/pt-internal/pt-internal.component';
import { PtMobileComponent }      from './pages/pt-mobile/pt-mobile.component';
import { RedteamDetailComponent } from './pages/redteam/redteam-detail.component';
import { AuditDetailComponent }   from './pages/audit/audit-detail.component';
import { OsComplianceComponent }  from './pages/os-compliance/os-compliance.component';
import { DbComplianceComponent }  from './pages/db-compliance/db-compliance.component';
import { IngestionComponent }     from './pages/ingestion/ingestion.component';
import { IntegrationsComponent }  from './pages/integrations/integrations.component';
import { ScoreAdminComponent }    from './pages/score-admin/score-admin.component';

const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'sast',          component: SastDetailComponent },
  { path: 'dast',          component: DastDetailComponent },
  { path: 'sca',           component: ScaDetailComponent },
  { path: 'bas',           component: BasDetailComponent },
  { path: 'cart',          component: CartDetailComponent },
  { path: 'firewall',      component: FirewallDetailComponent },
  { path: 'waf',           component: WafDetailComponent },
  { path: 'ips',           component: IpsDetailComponent },
  { path: 'siem',          component: SiemDetailComponent },
  { path: 'pt-external',   component: PtExternalComponent },
  { path: 'pt-internal',   component: PtInternalComponent },
  { path: 'pt-mobile',     component: PtMobileComponent },
  { path: 'redteam',       component: RedteamDetailComponent },
  { path: 'audit',         component: AuditDetailComponent },
  { path: 'os-compliance', component: OsComplianceComponent },
  { path: 'db-compliance', component: DbComplianceComponent },
  { path: 'ingestion',     component: IngestionComponent },
  { path: 'integrations',  component: IntegrationsComponent },
  { path: 'score-admin',   component: ScoreAdminComponent }
];

@NgModule({ imports: [RouterModule.forChild(routes)], exports: [RouterModule] })
export class AppPostureRoutingModule {}
