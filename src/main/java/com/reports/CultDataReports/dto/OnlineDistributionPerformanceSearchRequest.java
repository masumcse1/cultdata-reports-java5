package com.reports.CultDataReports.dto;

import java.util.List;

public  class OnlineDistributionPerformanceSearchRequest {
    private Integer client;
    private List<Integer> distributionManagers;
    int page;
    int  size;


    // Getters and setters
    public Integer getClient() { return client; }
    public void setClient(Integer client) { this.client = client; }
    public List<Integer> getDistributionManagers() { return distributionManagers; }
    public void setDistributionManagers(List<Integer> distributionManagers) {
        this.distributionManagers = distributionManagers;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }
}