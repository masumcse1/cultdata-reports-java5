package com.reports.CultDataReports.integraion;

import com.reports.CultDataReports.dto.ConoversionResponseDto;
import com.reports.CultDataReports.dto.ConversionDTO;
import com.reports.CultDataReports.exception.AppException;
import com.reports.CultDataReports.exception.ReportException;
import com.reports.CultDataReports.responsedto.ConversionRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Slf4j
@RequiredArgsConstructor
@Component
public class CultDataRestClientForConversion {

    private final RestTemplate restTemplate;

    @Value("${cultdata.api.key}")
    private String cultDataApiKey;

    @Value("${cultdata.api.base-url}")
    private String cultDataBaseUrl;

    @Value("${cultdata.api.conversion-page-limit}")
    private int conversionPageLimit;

    @Value("${cultdata.api.cultbooking-neo-channel-id}")
    private int cultbookingNeoChannelId;

    public List<ConversionDTO> getConversionsForAllClient(List<Integer> distributionManagers,String startDate, String endDate,Boolean excludeTestProperties) throws AppException{
        ConversionRequest request = new ConversionRequest();
        request.setLimit(conversionPageLimit);
        request.setPage(1);
        request.setChannelId(String.valueOf(cultbookingNeoChannelId));
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setExcludeTestProperties(excludeTestProperties);
        request.setCultSwitchDistributionManagerIds(distributionManagers);
        return getConversions(request);
    }

    public List<ConversionDTO> getConversionsByClientID(String clientID,String startDate, String endDate,Boolean excludeTestProperties) throws ReportException{

        ConversionRequest request = new ConversionRequest();
        request.setLimit(conversionPageLimit);
        request.setPage(1);
        request.setChannelId(String.valueOf(cultbookingNeoChannelId));
        request.setStartDate(startDate);
        request.setEndDate(endDate);
        request.setExcludeTestProperties(excludeTestProperties);
        request.setClientId(clientID);
    return getConversions(request);
    }

    public List<ConversionDTO> getConversions(ConversionRequest request) throws ReportException {
        String apiUrl = cultDataBaseUrl + "api/conversions-with-number-of-bookings-v3";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-KEY", cultDataApiKey);

        HttpEntity<ConversionRequest> requestEntity = new HttpEntity<>(request, headers);

        try {
            ResponseEntity<ConoversionResponseDto> response = restTemplate.exchange(
                    apiUrl,
                    HttpMethod.POST,
                    requestEntity,
                    new ParameterizedTypeReference<ConoversionResponseDto>() {}
            );

            ConoversionResponseDto responseBody = response.getBody();
            return (responseBody != null && responseBody.getData() != null) ?
                    responseBody.getData() : Collections.emptyList();

        } catch (RestClientException e) {
            log.error("Failed to fetch conversions from CultDataAPI: {}", e.getMessage(), e);
            throw new ReportException("Error while fetching conversions from CultDataAPI", e);
        } catch (Exception e) {
            log.error("Unexpected error while fetching conversions from CultDataAPI", e);
            throw new AppException("Error while fetching conversions from CultDataAPI", e);
        }
    }

}