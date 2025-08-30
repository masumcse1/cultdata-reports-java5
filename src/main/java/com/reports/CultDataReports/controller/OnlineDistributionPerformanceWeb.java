package com.reports.CultDataReports.controller;


import com.reports.CultDataReports.dto.Client6Dto;
import com.reports.CultDataReports.dto.DistributionManagerDTO;
import com.reports.CultDataReports.dto.OnlineDistributionPerformanceSearchRequest;
import com.reports.CultDataReports.dto.ReportDto;
import com.reports.CultDataReports.responsedto.ReportPage;
import com.reports.CultDataReports.service.IOnlineDistributionPerformanceSearchService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/odp/api")
public class OnlineDistributionPerformanceWeb {

    @Autowired
    private IOnlineDistributionPerformanceSearchService odpSearchService;

    private static final Logger logger = LoggerFactory.getLogger(OnlineDistributionPerformanceWeb.class);

    @GetMapping("/distribution-managers")
    public ResponseEntity<List<DistributionManagerDTO>> getDistributionManagers(
            @RequestParam(defaultValue = "true") Boolean onlyMapped) {

        logger.info("Fetching distribution managers request --start");

        List<DistributionManagerDTO> distributionManagerDTOs = odpSearchService.fetchDistributionManagers(onlyMapped);

        List<DistributionManagerDTO> response = distributionManagerDTOs.stream()
                .map(dto -> new DistributionManagerDTO(
                        dto.getId(),
                        dto.getName() ))
                .collect(Collectors.toList());

        logger.info("Fetching distribution managers request --end");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/odp-result-page")
    public ResponseEntity<ReportPage> searchOdpReports(
            @RequestBody OnlineDistributionPerformanceSearchRequest request,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "10") int limit) throws InterruptedException {

        logger.info("ODP search request --start");
        request.setPage(page);
        request.setSize(limit);

        ReportPage reportPage= null;

        try {
            if (request.getClient() == null) {
                reportPage = odpSearchService.getLatestReportsByDmID(request);
            } else {
                reportPage = odpSearchService.getLatestReportsByClientID(request);
            }
            reportPage.setIsDataNotExists(Boolean.FALSE);
        }catch (Exception exception){
            reportPage = new ReportPage();
            reportPage.setIsDataNotExists(Boolean.TRUE);
            return ResponseEntity.ok(reportPage);
        }


       Thread.sleep(2000);

        logger.info("ODP search request --end");
        return ResponseEntity.ok(reportPage);
    }

    private ReportDto convertToResponse(ReportDto dto) {
        ReportDto response = new ReportDto();

        Client6Dto client6Dto = new Client6Dto();
        client6Dto.setId(dto.getClient().getId());
        client6Dto.setName(dto.getClient().getName());
        response.setClient(client6Dto);

        response.setDmId(dto.getDmId());
        response.setDmName(dto.getDmName());
        response.setMonth(dto.getMonth());
        response.setPdf(dto.getPdf());
        return response;
    }

}