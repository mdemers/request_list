class RequestListController <  ApplicationController

  skip_before_action  :verify_authenticity_token

  def index
    flash.now[:success] = I18n.t('plugin.request_list.sent_items_message', {:sent => params[:sent]}) if params[:sent]

    if uris.empty?
      return render 'request_list/empty_list'
    end

    results = archivesspace.search_records(uris, {'resolve[]' => ['repository:id',
                                                                  'resource:id',
                                                                  'top_container_uri_u_sstr:id',
                                                                  'collection_uri_u_sstr:id',
                                                                  'ancestors:id@compact_resource',
                                                                 ]})
    @mapper = RequestList.new(results.records)

    excluded = {}
    AppConfig[:request_list][:repositories].each do |k,v|
      next if k == :default
      next unless @mapper.repos.has_key?(k)
      ((v[:item_opts] || {})[:excluded_request_types] || []).each do |rt|
        excluded[rt] ||= {}
        excluded[rt][k] = I18n.t('plugin.request_list.excluded_items_message',
                                 {:request_type => rt, :repo => @mapper.repos[k]})
      end
    end
    @excluded = excluded.to_json

  end


  def email


      RequestListMailer.email(mapper).deliver

      redirect_back(fallback_location: request[:request_uri]) and return

  end


  def pdf
    pdf = RequestListPDF.new(mapper, "#{request.protocol}#{request.host_with_port}")
    pdf_file = pdf.generate

    respond_to do |format|
      filename = pdf.filename

      format.all do
        fh = File.open(pdf_file.path, "r")
        self.headers["Content-type"] = "application/pdf"
        self.headers["Content-disposition"] = "attachment; filename=\"#{filename}\""
        self.response_body = Enumerator.new do |y|
          begin
            while chunk = fh.read(4096)
              y << chunk
            end
          ensure
            fh.close
            pdf_file.unlink
          end
        end
      end
    end
  end


  private


  def uris
    @uris ||= JSON.parse((cookies['as_pui_request_list_list_contents'] || '[]'))
  end


  def mapper
    @mapper ||= RequestList.new(archivesspace.search_records(uris, {'resolve[]' => ['repository:id',
                                                                                    'resource:id',
                                                                                    'top_container_uri_u_sstr:id',
                                                                                    'collection_uri_u_sstr:id',
                                                                                    'ancestors:id@compact_resource',
                                                                                   ]}).records)
  end
end
