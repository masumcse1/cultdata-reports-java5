package com.reports.CultDataReports.responsedto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConversionRequest {
    private Integer limit = 100;
    private Integer page = 1;
    private String clientId;
    private String channelId;
    private String startDate;
    private String endDate;
    private List<Integer> cultSwitchDistributionManagerIds;
    private Boolean excludeTestProperties = false;
}