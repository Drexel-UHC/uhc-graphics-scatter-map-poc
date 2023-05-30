{ # 1. Capital centroids -----------------------------------------------------

  file = 'capitals-gdppps17' 
  in_file = glue("{file}.json")
  out_file = glue("{file}-RL.geojson")
  
  { # import ------------------------------------------------------------------

    sf_data = geojson_read(in_file, what = "sp") %>% 
      st_as_sf(coords = c("longitude", "latitude"))
    
    sf_data %>% 
      leaflet() %>%
      addTiles() %>% 
      addCircleMarkers()
    
  }
  
  { # export ------------------------------------------------------------------
    
    ## export
    sf_data_1 %>% 
      st_write(out_file,
               driver = "GeoJSON")
    
    ## Test expport
    geojson_read(out_file, what = "sp") %>% 
      st_as_sf(coords = c("longitude", "latitude")) %>% 
      leaflet() %>%
      addTiles() %>% 
      addCircleMarkers()
  }
  
}

{ # 2. Land boundaries -----------------------------------------------------
  
  file = 'land' 
  in_file = glue("{file}.json")
  out_file = glue("{file}-RL.geojson")
  
  { # import ------------------------------------------------------------------
 
    sf_data = geojson_read(in_file, what = "sp") %>% 
      st_as_sf()
    
    sf_data %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
    
  }
  
  { # export ------------------------------------------------------------------
    
    ## export
    sf_data %>% st_write(out_file, driver = "GeoJSON")
    
    ## Test expport
    geojson_read(out_file, what = "sp") %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
  }
  
}

{ # 3. Country boundaries -----------------------------------------------------

  file = 'nuts0_gdppps17_topo' 
  in_file = glue("{file}.json")
  out_file = glue("{file}-RL.geojson")
  
  { # import ------------------------------------------------------------------
    
    sf_data = geojson_read(in_file, what = "sp") %>% 
      st_as_sf()
    
    sf_data %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
    
  }
  
  { # export ------------------------------------------------------------------
    
    ## export
    sf_data %>% st_write(out_file, driver = "GeoJSON")

    ## Test expport

    sf_data_tmp  <-  geojson_read(out_file, what = "sp") 
    sf_data_tmp %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
  }
}


{ # 4. Region boundaries -----------------------------------------------------
  #'  nuts2_gdppps17_topo.json
  file = 'nuts2_gdppps17_topo' 
  in_file = glue("{file}.json")
  out_file = glue("{file}-RL.geojson")
  
  { # import ------------------------------------------------------------------
    
    sf_data = geojson_read(in_file, what = "sp") %>% 
      st_as_sf()
    
    sf_data %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
    
  }
  
  { # export ------------------------------------------------------------------
    
    ## export
    sf_data %>% st_write(out_file, driver = "GeoJSON")
    
    ## Test expport
    
    sf_data_tmp  <-  geojson_read(out_file, what = "sp") 
    sf_data_tmp %>% 
      leaflet() %>%
      addTiles() %>% 
      addPolygons()
  }
}
