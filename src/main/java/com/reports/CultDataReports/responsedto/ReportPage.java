package com.reports.CultDataReports.responsedto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.reports.CultDataReports.dto.ReportDto;
import lombok.Data;

import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ReportPage {
    private Integer totalPages;
    private List<ReportDto> data;
    private Integer totalRecords;
    private Boolean isDataNotExists;

    public ReportPage() {
    }


}