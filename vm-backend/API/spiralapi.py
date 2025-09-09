from flask import Flask, jsonify, request, Blueprint
from app.database import engine, session, SessionLocal
from models.models import spiral_bvc
import logging
from motorcontroller import motor_controller
import datetime

spiral_print = Blueprint("spiralapi", __name__)
logger = logging.getLogger(__name__)


@spiral_print.route("/motors/initialize", methods=["POST"])
def initalize_motor():
    session = SessionLocal()
    try:
        created_count = 0
        for motor_id in range(1, 61):
            motor_address = motor_id - 1
            existing_card = session.query(spiral_bvc).filter_by(motor_position=str(motor_id)).first()
            if not existing_card:
                row = (motor_id - 1) // 10 + 1
                col = (motor_id - 1) % 10 + 1
                motor_card = spiral_bvc(
                    motor_position=str(motor_id),
                    row_number=row,
                    column_number=col,
                    motor_address=motor_address,
                    is_enabled=False
                )
                session.add(motor_card)
                created_count += 1

        session.commit()
        logger.info(f"Initialized {created_count} new motor cards")

        return jsonify({
            "message": "Motor card Initialization completed",
            "created_count": created_count,
            "total_motors": 60
        }), 201
    except Exception as e:
        session.rollback()
        logger.error(f"Error initializing motor cards: {e}")
        return jsonify({"error": "Failed to initialize motor cards"}), 500
    finally:
        session.close()


@spiral_print.route("/motors", methods=["GET"])
def get_motors():
    session = SessionLocal()
    try:
        motors = session.query(spiral_bvc).all()
        motors_list = []
        for motor in motors:
            motor_data = motor.to_dict()
            motor_data['hash_product'] = len(motor.products) > 0
            motors_list.append(motor_data)

        return jsonify({
            "motors": motors_list,
            "total_count": len(motors_list)
        }), 200
    finally:
        session.close()


@spiral_print.route("/motors/<int:position>", methods=["GET"])
def get_motor_by_position(position):
    session = SessionLocal()
    try:
        # Validate position range
        if position < 1 or position > 60:
            return jsonify({"error": "Motor position must be between 1 and 60"}), 400
            
        motor = session.query(spiral_bvc).filter_by(motor_position=str(position)).first()
        if not motor:
            return jsonify({"error": "Motor position not found"}), 404
            
        motor_data = motor.to_dict()
        motor_data['hash_product'] = len(motor.products) > 0
        motor_data['products'] = [product.to_dict() for product in motor.products]

        return jsonify(motor_data), 200
    finally:
        session.close()


@spiral_print.route('/motors/test/<int:position>', methods=['PUT'])
def toggle_motor_card(position):
    """Toggle motor card on/off"""
    session = SessionLocal()
    try:
        # Validate position range
        if position < 1 or position > 60:
            return jsonify({"error": "Motor position must be between 1 and 60"}), 400
            
        data = request.get_json()
        if not data or 'is_enabled' not in data:
            return jsonify({"error": "is_enabled field is required"}), 400
            
        is_enabled = data.get("is_enabled", False)
        
        # Remove .upper() and use string conversion of integer position
        motor_card = session.query(spiral_bvc).filter_by(motor_position=str(position)).first()
        if not motor_card:
            return jsonify({"error": "Motor card not found"}), 404
        
        motor_card.is_enabled = is_enabled
        motor_card.updated_at = datetime.datetime.utcnow()
        session.commit()
        
        logger.info(f"Motor card {position} {'enabled' if is_enabled else 'disabled'}")
        
        return jsonify({
            "message": f"Motor card {position} {'enabled' if is_enabled else 'disabled'}",
            "motor": motor_card.to_dict()
        }), 200
        
    except Exception as e:
        session.rollback()
        logger.error(f"Error toggling motor card {position}: {e}")
        return jsonify({"error": "Failed to toggle motor card"}), 500
    finally:
        session.close()


@spiral_print.route("/motors/enabled", methods=["GET"])
def enabled_motors():
    session = SessionLocal()
    try:
        enabled_motors = session.query(spiral_bvc).filter_by(is_enabled=True).all()

        motor_list = []
        for motoron in enabled_motors:
            motor_data = motoron.to_dict()
            motor_data['hash_product'] = len(motoron.products) > 0
            motor_list.append(motor_data)

        return jsonify({
            "enabled_motors": motor_list,
            "total_enabled": len(motor_list)
        }), 200
    finally:
        session.close()


@spiral_print.route("/motors/test/<int:position>", methods=["POST"])
def test_selected_spirals(position):
    try:
        # Validate position range
        if position < 1 or position > 60:
            return jsonify({"error": "Motor position must be between 1 and 60"}), 400
            
        data = request.get_json()
        duration = data.get('duration', 60)

        success = motor_controller.test_motor(position, duration)  # Use integer directly
        logger.info(f"Motor test for {position}: {'Success' if success else 'Failed'}")

        return jsonify({
            "message": f"Motor {position} test {'successful' if success else 'failed'}",
            "position": position,
            "duration": duration,
            "success": success
        }), 200

    except Exception as e:
        logger.error(f"Error testing motor {position}: {e}")
        return jsonify({"error": "Motor test failed"}), 500


@spiral_print.route("/methods/allmotortest", methods=["POST"])
def test_all_motors():
    try:
        data = request.get_json()
        duration = data.get('duration', 60)

        results = motor_controller.test_all_motors(duration)

        successful_tests = sum(1 for success in results.values() if success)
        failed_tests = len(results) - successful_tests

        logger.info(f"Motor tests completed: {successful_tests} successful, {failed_tests} failed")

        return jsonify({
            "message": "All motor tests completed",
            "results":  dict(sorted(results.items(), key=lambda x: int(x[0]))),
            "summary": {
                "total_tested": len(results),
                "successful": successful_tests,
                "failed": failed_tests
            }
        }), 200

    except Exception as e:
        logger.error(f"Error testing all motors: {e}")
        return jsonify({"error": "All motor test failed"}), 500