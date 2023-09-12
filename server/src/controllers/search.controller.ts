import { NextFunction, Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { MediaTypeQuery, PeopleFollow } from '~/constants/enums'
import { SearchQuery } from '~/models/requests/search.request'
import searchService from '~/services/search.service'

export const searchController = async (
  req: Request<ParamsDictionary, any, any, SearchQuery>,
  res: Response,
  next: NextFunction
) => {
  const limit = Number(req.params.limit)
  const page = Number(req.query.page)

  const result = await searchService.search({
    limit,
    page,
    content: req.query.content,
    media_type: req.query.media_type as MediaTypeQuery,
    people_follow: req.query.people_follow as PeopleFollow,
    user_id: req.decoded_authorization?.user_id
  })

  return res.json({
    message: 'search Successfully',
    result: {
        tweets: result.tweets,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}
