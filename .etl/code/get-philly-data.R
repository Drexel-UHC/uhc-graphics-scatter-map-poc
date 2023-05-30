{ # Setup -------------------------------------------------------------------

  ## objects
  year <- 2020
  
  ## xwalk_county_zcta
  load("clean/zcta-count-sf.rdata")
  vec__counties = names(list_sf_counties)
  xwalk_county_zcta = vec__counties %>% 
    map_df(~{
      vec__zcta = list_sf_zcta[[.x]] %>% as.data.frame() %>% pull(zcta)
      df_county = list_sf_counties[[.x]] %>% as.data.frame() %>% select(name = NAME, fips = GEOID)
      tibble(county = df_county$name,
             fip = df_county$fip,
             zcta = vec__zcta)
    }) %>% 
    group_by(zcta) %>% 
    slice(1) %>% 
    ungroup()
  
  ## imports
  load("clean/sf_county_prccsa_simp.rdata")
  load("clean/zcta-count-sf.rdata")
  
}

{ # ACS data ---------------------------------------------------------------
  df_acs  <- get_acs(geography = "zcta", 
                     variables = "B19013_001", 
                     year = year) %>% 
    select(zcta = GEOID, median_income = estimate)
  
  df_income =   df_acs %>% 
    filter(zcta%in%xwalk_county_zcta$zcta) %>% 
    left_join(xwalk_county_zcta) %>% 
    filter(!is.na(median_income)) %>% 
    rename(gdppps17 = median_income)
  
  df_county = df_income %>% 
    group_by(county,fip) %>% 
    summarize(gdppps17 = median(gdppps17)) %>% 
    ungroup()  
  
  df_acs %>% 
    filter(!is.na(median_income)) %>% 
    pull(median_income) %>% 
    quantile(probs = seq(0, 1, by = 1/6))
}


{ # Boundaries -------------------------------------------------------------------------
  { # land --------------------------------------------------------------------
    
    sf_land <- states(cb =T, 
                      resolution = "5m", 
                      class = "sf") %>%
      filter(STUSPS == "PA") %>% 
      mutate(FID = 1) %>% 
      select(FID)
   
    sf_land_minus_water = sf_land %>%
      tigris::erase_water() 
    sf_land_minus_water %>% 
      leaflet() %>% 
      addTiles() %>% 
      addPolygons()
  }
  
  
  { # county ------------------------------------------------------------------
    sf_county = sf_county_prccsa_simp %>% 
      select(fip = GEOID) %>% 
      left_join(df_county) %>% 
      mutate(id = county,
             CNTR_CODE = county,
             NUTS_NAME = county,
             LEVL_CODE = 0,
             FID = county,
             NUTS_ID = county,
             geo = county) %>% 
      select(id, CNTR_CODE, NUTS_NAME, LEVL_CODE,
             FID, NUTS_ID, geo, gdppps17)
    
    
    sf_county %>% 
      leaflet() %>% 
      addTiles() %>% 
      addPolygons()
  }
  
  load("clean/sf_zcta_prccsa.rdata")
  
  { # zcta --------------------------------------------------------------------
    load("clean/sf_zcta_prccsa.rdata")
    
    sf_zcta = sf_zcta_prccsa %>% 
      left_join(df_income) %>% 
      filter(!is.na(gdppps17)) %>% 
      left_join(xwalk_county_zcta) %>% 
      mutate(zcta_name = glue("ZCTA {zcta}")) %>% 
      mutate(id = zcta,
             CNTR_CODE = county,
             NUTS_NAME = zcta_name,
             LEVL_CODE = 2,
             FID = zcta,
             NUTS_ID = zcta,
             geo = zcta) %>% 
      select(id, CNTR_CODE, NUTS_NAME, LEVL_CODE,
             FID, NUTS_ID, geo, gdppps17)
      
    sf_zcta %>% 
      leaflet() %>% 
      addTiles() %>% 
      addPolygons()
    
  }
  
  { # dummy capital -----------------------------------------------------------
    sf_capitals = sf_zcta %>% 
      group_by(CNTR_CODE) %>% 
      filter(gdppps17 == max(gdppps17)) %>% 
      ungroup() %>% 
      mutate(name = glue("{CNTR_CODE} Capital Name")) %>% 
      select(name, NUTS_ID, CNTR_CODE, gdppps17) %>% 
      st_centroid()
  }
  
}

{ # Export ------------------------------------------------------------------

  sf_land %>% st_write("sf_land.geojson", driver = "GeoJSON")
  sf_county %>% st_write("sf_county.geojson", driver = "GeoJSON")
  sf_zcta %>% st_write("sf_zcta.geojson", driver = "GeoJSON")
  sf_capitals  %>% st_write("sf_capital.geojson", driver = "GeoJSON")
}



