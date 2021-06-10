Rails.application.routes.draw do

  get  '/plugin/request_list/list',  to: 'request_list#index'
  post '/plugin/request_list/email', to: 'request_list#email'
  get  '/plugin/request_list/pdf',   to: 'request_list#pdf'

end
