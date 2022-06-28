Rails.application.routes.draw do
  [AppConfig[:public_proxy_prefix], AppConfig[:public_prefix]].uniq.each do |prefix|
    scope prefix do
      get  '/plugin/request_list/list',  to: 'request_list#index'
      post '/plugin/request_list/email', to: 'request_list#email'
      get  '/plugin/request_list/pdf',   to: 'request_list#pdf'
    end
  end
end
