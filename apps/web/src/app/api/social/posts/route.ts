
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { content, media_type } = await request.json();

    if (!content || typeof content !== 'string') {
        return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    // Get Auth Token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
        return NextResponse.json({ error: 'Missing Authorization Header' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('posts')
        .insert({
            content,
            user_id: user.id,
            media_type: media_type || 'text' // Optional media_type
        })
        .select(`
            *,
            user:user_id (
                id,
                username,
                avatar_url
            )
        `)
        .single();
    
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
