-module(play_resource).
-export([run/2]).
-compile([{parse_transform, lager_transform}]).
-include("session.hrl").

run(Args, Session = #session{pbx = Pbx}) ->
  Guid = proplists:get_value(resource_guid, Args),
  Resource = resource:prepare(Guid, Session),
  lager:info("Playing resource ~p", [Resource]),
  Pbx:play(Resource),
  {next, Session}.

