from flask import Flask, request, jsonify, send_from_directory,Blueprint
from models.models import Video
from app.database import SessionLocal
import os
from werkzeug.utils import secure_filename
from datetime import datetime


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads/videos'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
video_print=Blueprint("videosapi",__name__)

# POST: Upload Video
from flask import request, jsonify
from datetime import datetime
from models.models import Video
from app.database import SessionLocal
from sqlalchemy.exc import SQLAlchemyError

@video_print.route('/videos/base64', methods=['POST'])
def upload_video_base64():
    session = SessionLocal()
    try:
        data = request.get_json()
        title = data.get("title")
        filename = data.get("filename") or title  # fallback to title if filename is not provided
        base64_data = data.get("video_base64")
        machine_guid = data.get("Machine_Guid")

        if not title or not base64_data or not machine_guid:
            return jsonify({"error": "Missing required fields"}), 400

        new_video = Video(
            title=title,
            filename=filename,
            video_base64=base64_data,
            Machine_Guid=machine_guid,
            upload_time=datetime.utcnow()
        )

        session.add(new_video)
        session.commit()

        return jsonify({"success": True, "video_id": new_video.video_id}), 201

    except SQLAlchemyError as e:
        session.rollback()
        return jsonify({"error": str(e)}), 500

    finally:
        session.close()
        
# GET: List Videos (Filtered by Machine_Guid)
@video_print.route('/videos/get', methods=['GET'])
def get_videos():
    session = SessionLocal()
    machine_guid = request.args.get('machine_guid')

    query = session.query(Video)
    if machine_guid:
        query = query.filter(Video.Machine_Guid == machine_guid)

    videos = query.all()
    return jsonify([{
        'video_id': v.video_id,
        'title': v.title,
        'filename': v.filename,
        'video_base64': v.video_base64,
        'upload_time': v.upload_time.isoformat(),
        'Machine_Guid': v.Machine_Guid
    } for v in videos])

#GET: Serve Video File
@video_print.route('/videos/get/<int:video_id>', methods=['GET'])
def get_video_file(video_id):
    session = SessionLocal()
    video = session.query(Video).get(video_id)
    if not video:
        return jsonify({'error': 'Not found'}), 404
    return send_from_directory(app.config['UPLOAD_FOLDER'], video.filename)

#PUT: Update Video
@video_print.route('/videos/update/<int:video_id>', methods=['PUT'])
def update_video(video_id):
    session = SessionLocal()
    video = session.query(Video).get(video_id)
    if not video:
        return jsonify({'error': 'Video not found'}), 404

    title = request.form.get('title')
    file = request.files.get('file')
    machine_guid = request.form.get('Machine_Guid')

    if title:
        video.title = title
    if machine_guid:
        video.Machine_Guid = machine_guid
    if file:
        # Remove old file
        try:
            os.remove(os.path.join(app.config['UPLOAD_FOLDER'], video.filename))
        except FileNotFoundError:
            pass
        new_filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], new_filename))
        video.filename = new_filename

    session.commit()
    return jsonify({'success': True})

#DELETE: Delete Video
@video_print.route('/videos/delete/<int:video_id>', methods=['DELETE'])
def delete_video(video_id):
    session = SessionLocal()
    video = session.query(Video).get(video_id)
    if not video:
        return jsonify({'error': 'Not found'}), 404

    try:
        os.remove(os.path.join(app.config['UPLOAD_FOLDER'], video.filename))
    except FileNotFoundError:
        pass

    session.delete(video)
    session.commit()
    return jsonify({'success': True})
