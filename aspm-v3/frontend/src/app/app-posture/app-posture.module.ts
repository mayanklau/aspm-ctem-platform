import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { AppPostureRoutingModule } from './app-posture-routing.module';

import { LandingComponent }        from './pages/landing/landing.component';
import { SastDetailComponent }     from './pages/sast/sast-detail.component';
import { DastDetailComponent }     from './pages/dast/dast-detail.component';
import { ScaDetailComponent }      from './pages/sca/sca-detail.component';
import { BasDetailComponent }      from './pages/bas/bas-detail.component';
import { CartDetailComponent }     from './pages/cart/cart-detail.component';
import { FirewallDetailComponent } from './pages/firewall/firewall-detail.component';
import { WafDetailComponent }      from './pages/waf/waf-detail.component';
import { IpsDetailComponent }      from './pages/ips/ips-detail.component';
import { SiemDetailComponent }     from './pages/siem/siem-detail.component';
import { PtExternalComponent }     from './pages/pt-external/pt-external.component';
import { PtInternalComponent }     from './pages/pt-internal/pt-internal.component';
import { PtMobileComponent }       from './pages/pt-mobile/pt-mobile.component';
import { RedteamDetailComponent }  from './pages/redteam/redteam-detail.component';
import { AuditDetailComponent }    from './pages/audit/audit-detail.component';
import { OsComplianceComponent }   from './pages/os-compliance/os-compliance.component';
import { DbComplianceComponent }   from './pages/db-compliance/db-compliance.component';
import { IngestionComponent }      from './pages/ingestion/ingestion.component';
import { IntegrationsComponent }   from './pages/integrations/integrations.component';
import { ScoreAdminComponent }     from './pages/score-admin/score-admin.component';

import { GaugeComponent }     from './components/gauge/gauge.component';
import { SevBarsComponent }   from './components/sev-bars/sev-bars.component';
import { DonutComponent }     from './components/donut/donut.component';
import { ChartComponent }     from './components/chart/chart.component';
import { SeverityBadgeComponent } from './components/severity-badge/severity-badge.component';
import { PostureGaugeComponent }  from './components/posture-gauge/posture-gauge.component';
import { FindingTableComponent }  from './components/finding-table/finding-table.component';

import { SumByPipe } from './pipes/sum-by.pipe';
import { AvgByPipe } from './pipes/avg-by.pipe';
import { MinPipe }   from './pipes/min.pipe';

import { AppPostureCxoWidgetsComponent } from '../cxo-dashboard/widgets/app-posture-widgets.component';

@NgModule({
  declarations: [
    LandingComponent, SastDetailComponent, DastDetailComponent, ScaDetailComponent,
    BasDetailComponent, CartDetailComponent, FirewallDetailComponent, WafDetailComponent,
    IpsDetailComponent, SiemDetailComponent, PtExternalComponent, PtInternalComponent,
    PtMobileComponent, RedteamDetailComponent, AuditDetailComponent,
    OsComplianceComponent, DbComplianceComponent, IngestionComponent,
    IntegrationsComponent, ScoreAdminComponent,
    GaugeComponent, SevBarsComponent, DonutComponent, ChartComponent,
    SeverityBadgeComponent, PostureGaugeComponent, FindingTableComponent,
    SumByPipe, AvgByPipe, MinPipe,
    AppPostureCxoWidgetsComponent
  ],
  imports: [CommonModule, FormsModule, HttpClientModule, RouterModule, AppPostureRoutingModule],
  exports: [AppPostureCxoWidgetsComponent]
})
export class AppPostureModule {}
