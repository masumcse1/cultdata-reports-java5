package com.reports.CultDataReports.service;


import com.reports.CultDataReports.dto.*;
import com.reports.CultDataReports.responsedto.ReportPage;

import java.util.List;

public interface IOnlineDistributionPerformanceSearchService {

    ReportPage getLatestReportsByDmID(OnlineDistributionPerformanceSearchRequest dto);
    public ReportPage getLatestReportsByClientID(OnlineDistributionPerformanceSearchRequest dto) ;
    List<DistributionManagerDTO> fetchDistributionManagers(Boolean onlyMapped);

}