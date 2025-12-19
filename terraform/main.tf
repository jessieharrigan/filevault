terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0.2"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}

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

resource "null_resource" "docker_push" {
  depends_on = [azurerm_container_registry.acr]

  triggers = {
    image_tag = "v1.0.1" 
  }

  provisioner "local-exec" {
    # Move up one level from 'terraform' folder, then into 'src/azure-sa'
    working_dir = "${path.module}/../src/azure-sa" 

    command = <<EOT
      az acr login --name ${azurerm_container_registry.acr.name}
      docker build --platform linux/amd64 -t ${azurerm_container_registry.acr.login_server}/filevault-app:${self.triggers.image_tag} .
      docker push ${azurerm_container_registry.acr.login_server}/filevault-app:${self.triggers.image_tag}
    EOT
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
    null_resource.docker_push, 
    azurerm_storage_container.container
  ]

  container {
    name   = "filevault-app-jessie"
    image  = "${azurerm_container_registry.acr.login_server}/filevault-app:${null_resource.docker_push.triggers.image_tag}"
    cpu    = "1"
    memory = "1.5"

    ports {
      port     = 3000
      protocol = "TCP"
    }

    secure_environment_variables = {
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