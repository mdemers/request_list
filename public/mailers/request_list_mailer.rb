class RequestListMailer < ApplicationMailer
  def email(mapper)
    # the plugin dir is not in the view path in this context, so render the template manually
    view_path = File.join(File.dirname(__FILE__), '..', 'views')
    email_body = render(file: File.join(view_path, 'request_list_mailer', 'email'),
                        locals: {mapper: mapper, view_path: view_path},
                        layout: 'layouts/mailer')

    File.open('/tmp/moo.html', "w") do |io|
      io.write email_body
    end

    mail(
         from: I18n.t('plugin.request_list.email.from'),
         to: 'mdemers@hagley.org',
         subject: I18n.t('plugin.request_list.email.subject'),
         content_type: 'text/html',
         body: email_body,
         )
  end
end
