variable "resource_group_name" {
  default = "rg-filevault"
}

variable "location" {
    default = "uksouth"
}

variable "azurerm_virtual_network" {
    default = "vnet-filevault"
}

variable "storage_account_name" {
  default = "filevaultjessiestorage"
}

variable "container_name" {
  default = "filevault-container"
}

variable "environment" {
  default = "Weapon of Choice"
}
