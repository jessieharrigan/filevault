variable "suffix" {
  type        = string
  default     = "jessie" 
}

variable "container_image_tag" {
  type    = string
  default = "latest"
}

variable "key_vault_name" {
  type        = string
  description = "The name of the Azure Key Vault"
  default     = "kv-filevault-jessie" 
}

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
