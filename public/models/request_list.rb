class RequestList

  @@init = false
  @@profiles = {}

  def self.init(config)
    @@request_handlers = config[:request_handlers]
    @@repositories = config[:repositories]

    raise 'Bad RequestList configuration' unless (@@request_handlers && @@repositories)

    begin
      @@repositories[:default][:handler]
      @@repositories[:default][:opts] ||= {}
    rescue
      raise 'You must provide a default handler in RequestList configuration.'
    end

    @@init = true
  end


  def self.register_list_mapper(mapper_class, profile)
    @@profiles[profile] ||= {}
    @@profiles[profile][:list_mapper] = mapper_class
  end


  def self.register_item_mapper(mapper_class, profile, record_type)
    @@profiles[profile] ||= {}
    @@profiles[profile][:item_mappers] ||= {}
    @@profiles[profile][:item_mappers][record_type] = mapper_class
  end


  def initialize(records)
    raise 'Call RequestList.init(config) before trying to instantiate.' unless @@init

    @handlers = {}
    @records = records

    @records.each do |record|
      handler_for(record).add(record)
    end
  end


  def handler_for(record)
    repo = record.resolved_repository['repo_code']    
    repo_args = @@repositories[:default]
    repo_args.merge!(@@repositories[repo]) if @@repositories.has_key?(repo)

    handler_args = @@request_handlers[repo_args[:handler]]

    @handlers[repo_args[:handler]] ||= RequestListHandler.new(handler_args[:name],
                                                              handler_args[:profile],
                                                              handler_args[:url],
                                                              list_mapper_for(handler_args[:profile], repo_args[:opts]),
                                                              item_mappers_for(handler_args[:profile], repo_args[:opts]))
  end


  def list_mapper_for(profile, opts)
    @@profiles[profile][:list_mapper].new(profile, opts)
  end


  def item_mappers_for(profile, opts)
    Hash[@@profiles[profile][:item_mappers].map {|k, v| [k, v.new(profile, opts)]}]
  end


  def handlers
    @handlers.values
  end

end
