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

resource "azurerm_container_registry" "acr" {
  name                = "filevaultjessie"
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  sku                 = "Basic"
  admin_enabled       = true
}