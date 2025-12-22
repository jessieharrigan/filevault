resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
  tags = {
        Environment = "Weapon of Choice"
        Team = "DevOps"
    }
}

resource "azurerm_virtual_network" "vnet" {
  name                = var.azurerm_virtual_network
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

resource "azurerm_storage_account" "storage" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  
  tags = {
    environment = "Weapon of Choice"
  }
}

resource "azurerm_storage_container" "container" {
  name                  = var.container_name
  storage_account_name   = azurerm_storage_account.storage.name
  container_access_type = "private"
}

resource "time_sleep" "wait_for_rg" {
  depends_on = [azurerm_resource_group.rg]
  create_duration = "10s"
}

resource "azurerm_container_registry" "acr" {
  depends_on = [time_sleep.wait_for_rg]
  name                = "filevaultjessie"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}

resource "azurerm_container_group" "app" {
  name                = "filevault-app-jessie"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  ip_address_type     = "Public"
  dns_name_label      = "filevault-app-jessie"
  os_type             = "Linux"

  depends_on = [
    azurerm_resource_group.rg, 
    azurerm_storage_container.container
  ]

  diagnostics {
    log_analytics {
      workspace_id  = azurerm_log_analytics_workspace.logs.workspace_id
      workspace_key = azurerm_log_analytics_workspace.logs.primary_shared_key
    }
  }

  container {
    name   = "filevault-app-jessie"
    image  = "${azurerm_container_registry.acr.login_server}/filevault-app:${var.container_image_tag}"
    cpu    = "1"
    memory = "1.5"

    ports {
      port     = 3000
      protocol = "TCP"
    }

    liveness_probe {
      http_get {
        path = "/"
        port = 3000
      }
      initial_delay_seconds = 30
      period_seconds        = 10
      failure_threshold = 3
    }

    secure_environment_variables = {
      "APPLICATIONINSIGHTS_CONNECTION_STRING" = azurerm_application_insights.app_insights.connection_string
      "AZURE_STORAGE_ACCOUNT_NAME" = azurerm_storage_account.storage.name
      "AZURE_STORAGE_ACCOUNT_KEY"  = azurerm_storage_account.storage.primary_access_key
      "AZURE_CONTAINER_NAME" = azurerm_storage_container.container.name
    }

  }
  image_registry_credential {
    server   = azurerm_container_registry.acr.login_server
    username = azurerm_container_registry.acr.admin_username
    password = azurerm_container_registry.acr.admin_password
  }
}

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "filevault-law"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_application_insights" "app_insights" {
  name                = "filevault-app-insights"
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
  workspace_id        = azurerm_log_analytics_workspace.logs.id
  application_type    = "web"
}