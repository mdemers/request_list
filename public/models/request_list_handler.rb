require 'pp'

class RequestListHandler

  attr_reader :name, :profile, :url

  def initialize(name, profile, url, list_mapper)
    @name = name
    @profile = profile
    @url = url
    @list_mapper = list_mapper
    @item_mappers = {}
    @items = []
    @unhandled_items = []
  end


  def add_item_mappers_for_repo(repo, item_mappers)
    @item_mappers[repo] = item_mappers
  end


  def add(item)
    @items.push(item)
  end


  def list_opts
    @list_mapper.opts
  end


  def list_map
    @list_mapper.map    
  end


  def each_item_map
    @items.each do |item|
      mapper = item_mapper_for(item)
      if mapper
        pp ['IIII', item]
        pp ['MMMM', mapper.map(item)]
        yield [item, mapper.map(item)]
      else
        Rails.logger.debug("RequestListHandler: No handler for #{item}")
        @unhandled_items.push(item)
      end
    end
    @unhandled_items
  end


  def item_mapper_for(item)
    @item_mappers[item.resolved_repository['repo_code']][item.class]
  end

end
