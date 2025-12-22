resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
  tags = {
        Environment = "Weapon of Choice"
        Team = "DevOps"
    }
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

  identity {
    type = "SystemAssigned"
  }

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
      KEY_VAULT_NAME             = azurerm_key_vault.kv.name
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