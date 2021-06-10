
raise 'No config found for request_list plugin!' unless AppConfig.has_key?(:request_list)

cfg = AppConfig[:request_list]

Plugins::extend_aspace_routes(File.join(File.dirname(__FILE__), "routes.rb"))

Plugins::add_menu_item('/plugin/request_list/list', 'plugin.request_list.menu_label')

Plugins::add_record_page_action_erb(cfg.fetch(:record_types, ['archival_object', 'accession']),
                                    'request_list/action_button',
                                    cfg.fetch(:button_position, nil))

ArchivesSpacePublic::Application.class_eval do
    config.paths["app/mailers"].concat(ASUtils.find_local_directories("public/mailers"))
end

Rails.application.config.after_initialize do
  RequestList.init(cfg)
end
